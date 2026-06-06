import { z } from "zod";

export const documentMetadataSchema = z
  .object({
    title: z.string().min(1).optional(),
    classification: z.string().min(1).optional(),
    ownerId: z.string().min(1).optional(),
  })
  .optional();

export const createStoredRedactionSchema = z.object({
  terms: z.string().min(1, "terms is required"),
  documentText: z.string(),
  metadata: documentMetadataSchema,
});

export const unredactStoredDocumentSchema = z.object({
  key: z.string().min(1, "key is required"),
});
