import { z } from "zod";

// Owned by servers/api (contracts.md -> "ownership before reuse") — the
// API is the boundary owner. apps/web defines its own local types for
// what it consumes rather than importing this (ADR-012 -> "Contract
// placement").

export const createNoteRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(20000).optional(),
});
export type CreateNoteRequest = z.infer<typeof createNoteRequestSchema>;

// Partial update: at least one of title/body must be present, otherwise
// there is nothing to change.
export const updateNoteRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().max(20000).optional(),
  })
  .refine((data) => data.title !== undefined || data.body !== undefined, {
    message: "At least one of title or body must be provided.",
  });
export type UpdateNoteRequest = z.infer<typeof updateNoteRequestSchema>;

export interface NoteSummary {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
