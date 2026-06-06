import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { ZodError } from "zod";
import {
  API_ERROR_CODES,
  API_ERROR_MESSAGES,
  API_ROUTES,
  API_SERVICE_NAME,
  API_STORAGE_ENGINE,
  API_VERSION,
} from "./constants/apiConstants.js";
import { DEFAULT_SQLITE_PATH } from "./documents/constants/documentConstants.js";
import { createDocumentRouter } from "./documents/routes.js";
import { SqliteDocumentRepository } from "./documents/repositories/SqliteDocumentRepository.js";
import { redactRequestSchema, unredactRequestSchema } from "./schemas/redactionSchemas.js";

export function createApp(options: { databasePath?: string } = {}) {
  const app = express();
  const documentRepository = new SqliteDocumentRepository(options.databasePath ?? process.env.SQLITE_PATH ?? DEFAULT_SQLITE_PATH);

  app.use(cors());
  app.use((request, response, next) => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    response.locals.requestId = requestId;
    response.setHeader("x-request-id", requestId);
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    const startedAt = Date.now();

    response.on("finish", () => {
      console.info(
        JSON.stringify({
          event: "http_request",
          method: request.method,
          path: request.path,
          requestId: response.locals.requestId,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        })
      );
    });

    next();
  });

  app.get(API_ROUTES.HEALTH, (_request, response) => {
    response.json({
      status: "ok",
      service: API_SERVICE_NAME,
      version: API_VERSION,
      storage: API_STORAGE_ENGINE,
    });
  });

  app.post(API_ROUTES.REDACTIONS, (request, response, next) => {
    try {
      const payload = redactRequestSchema.parse(request.body);
      response.status(201).json(redactDocument(payload.terms, payload.documentText));
    } catch (error) {
      next(error);
    }
  });

  app.post(API_ROUTES.UNREDACTIONS, (request, response, next) => {
    try {
      const payload = unredactRequestSchema.parse(request.body);
      response.json(unredactDocument(payload.key, payload.documentText));
    } catch (error) {
      next(error);
    }
  });

  app.use(API_ROUTES.DOCUMENTS, createDocumentRouter(documentRepository));

  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: API_ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.flatten(),
        requestId: response.locals.requestId,
      },
    });
    return;
  }

  if (error instanceof RedactionError) {
    response.status(422).json({
      error: {
        code: error.code,
        message: error.message,
        requestId: response.locals.requestId,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: API_ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      requestId: response.locals.requestId,
    },
  });
};
