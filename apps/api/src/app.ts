import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { ZodError, z } from "zod";

const redactRequestSchema = z.object({
  terms: z.string().min(1, "terms is required"),
  documentText: z.string(),
});

const unredactRequestSchema = z.object({
  key: z.string().min(1, "key is required"),
  documentText: z.string(),
});

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/redactions", (request, response, next) => {
    try {
      const payload = redactRequestSchema.parse(request.body);
      response.status(201).json(redactDocument(payload.terms, payload.documentText));
    } catch (error) {
      next(error);
    }
  });

  app.post("/unredactions", (request, response, next) => {
    try {
      const payload = unredactRequestSchema.parse(request.body);
      response.json(unredactDocument(payload.key, payload.documentText));
    } catch (error) {
      next(error);
    }
  });

  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request payload is invalid.",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof RedactionError) {
    response.status(422).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};
