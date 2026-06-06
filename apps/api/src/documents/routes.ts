import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { Router } from "express";
import { API_ERROR_CODES, API_ERROR_MESSAGES } from "../constants/apiConstants.js";
import { DOCUMENT_AUDIT_ACTIONS } from "./constants/documentConstants.js";
import { DOCUMENT_ROUTES } from "./constants/documentRoutes.js";
import type { SqliteDocumentRepository } from "./repositories/SqliteDocumentRepository.js";
import { createStoredRedactionSchema, unredactStoredDocumentSchema } from "./schemas/documentSchemas.js";

export function createDocumentRouter(repository: SqliteDocumentRepository) {
  const router = Router();

  router.post(DOCUMENT_ROUTES.REDACTIONS, (request, response, next) => {
    try {
      const payload = createStoredRedactionSchema.parse(request.body);
      const redaction = redactDocument(payload.terms, payload.documentText);
      const documentInput = {
        redactedText: redaction.redactedText,
        key: redaction.key,
        redactions: redaction.redactions,
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
      };
      const document = repository.createDocument(documentInput);

      response.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });

  router.get(DOCUMENT_ROUTES.ROOT, (request, response) => {
    const redactedTerm = typeof request.query.redactedTerm === "string" ? request.query.redactedTerm : undefined;

    response.json(repository.searchDocuments(redactedTerm));
  });

  router.get(DOCUMENT_ROUTES.BY_ID, (request, response) => {
    const document = repository.getDocument(request.params.id);

    if (!document) {
      response
        .status(404)
        .json({ error: { code: API_ERROR_CODES.DOCUMENT_NOT_FOUND, message: API_ERROR_MESSAGES.DOCUMENT_NOT_FOUND } });
      return;
    }

    response.json(document);
  });

  router.get(DOCUMENT_ROUTES.BY_ID_REDACTIONS, (request, response) => {
    const redactions = repository.getDocumentRedactions(request.params.id);

    if (!redactions) {
      response
        .status(404)
        .json({ error: { code: API_ERROR_CODES.DOCUMENT_NOT_FOUND, message: API_ERROR_MESSAGES.DOCUMENT_NOT_FOUND } });
      return;
    }

    response.json({ redactions });
  });

  router.get(DOCUMENT_ROUTES.BY_ID_AUDIT_EVENTS, (request, response) => {
    response.json({ auditEvents: repository.listAuditEvents(request.params.id) });
  });

  router.post(DOCUMENT_ROUTES.BY_ID_UNREDACTIONS, (request, response, next) => {
    try {
      const payload = unredactStoredDocumentSchema.parse(request.body);
      const redactedText = repository.getStoredRedactedText(request.params.id);

      if (!redactedText) {
        response
          .status(404)
          .json({ error: { code: API_ERROR_CODES.DOCUMENT_NOT_FOUND, message: API_ERROR_MESSAGES.DOCUMENT_NOT_FOUND } });
        return;
      }

      const result = unredactDocument(payload.key, redactedText);
      repository.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.UNREDACTED, request.params.id, {});
      response.json(result);
    } catch (error) {
      if (error instanceof RedactionError) {
        repository.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.UNREDACTION_FAILED, request.params.id, { code: error.code });
      }

      next(error);
    }
  });

  return router;
}
