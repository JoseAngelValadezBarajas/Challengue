import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { Router } from "express";
import { DOCUMENT_AUDIT_ACTIONS } from "./constants/documentConstants.js";
import type { SqliteDocumentRepository } from "./repositories/SqliteDocumentRepository.js";
import { createStoredRedactionSchema, unredactStoredDocumentSchema } from "./schemas/documentSchemas.js";

export function createDocumentRouter(repository: SqliteDocumentRepository) {
  const router = Router();

  router.post("/redactions", (request, response, next) => {
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

  router.get("/", (request, response) => {
    const redactedTerm = typeof request.query.redactedTerm === "string" ? request.query.redactedTerm : undefined;

    response.json(repository.searchDocuments(redactedTerm));
  });

  router.get("/:id", (request, response) => {
    const document = repository.getDocument(request.params.id);

    if (!document) {
      response.status(404).json({ error: { code: "DOCUMENT_NOT_FOUND", message: "Document was not found." } });
      return;
    }

    response.json(document);
  });

  router.get("/:id/redactions", (request, response) => {
    const redactions = repository.getDocumentRedactions(request.params.id);

    if (!redactions) {
      response.status(404).json({ error: { code: "DOCUMENT_NOT_FOUND", message: "Document was not found." } });
      return;
    }

    response.json({ redactions });
  });

  router.get("/:id/audit-events", (request, response) => {
    response.json({ auditEvents: repository.listAuditEvents(request.params.id) });
  });

  router.post("/:id/unredactions", (request, response, next) => {
    try {
      const payload = unredactStoredDocumentSchema.parse(request.body);
      const redactedText = repository.getStoredRedactedText(request.params.id);

      if (!redactedText) {
        response.status(404).json({ error: { code: "DOCUMENT_NOT_FOUND", message: "Document was not found." } });
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
