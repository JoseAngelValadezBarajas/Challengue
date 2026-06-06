import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { Router } from "express";
import { z } from "zod";
import type { SqliteDocumentRepository } from "./sqliteDocumentRepository.js";

const metadataSchema = z
  .object({
    title: z.string().min(1).optional(),
    classification: z.string().min(1).optional(),
    ownerId: z.string().min(1).optional(),
  })
  .optional();

const createStoredRedactionSchema = z.object({
  terms: z.string().min(1, "terms is required"),
  documentText: z.string(),
  metadata: metadataSchema,
});

const unredactStoredDocumentSchema = z.object({
  key: z.string().min(1, "key is required"),
});

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
      repository.recordAuditEvent("DOCUMENT_UNREDACTED", request.params.id, {});
      response.json(result);
    } catch (error) {
      if (error instanceof RedactionError) {
        repository.recordAuditEvent("DOCUMENT_UNREDACTION_FAILED", request.params.id, { code: error.code });
      }

      next(error);
    }
  });

  return router;
}
