import { z } from "zod";

export const redactRequestSchema = z.object({
  terms: z.string().min(1, "terms is required"),
  documentText: z.string(),
});

export const unredactRequestSchema = z.object({
  key: z.string().min(1, "key is required"),
  documentText: z.string(),
});
