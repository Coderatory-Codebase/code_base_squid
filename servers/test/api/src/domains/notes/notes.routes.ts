import { Router, type Response } from "express";
import { ZodError } from "zod";
import { createNoteRequestSchema, updateNoteRequestSchema } from "./notes.contracts.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { createProfileRateLimit } from "../auth/auth.rate-limit.js";
import { env } from "../../config/env.js";
import {
  createNote,
  deleteOwnedNote,
  getOwnedNote,
  listNotes,
  toNoteSummary,
  updateOwnedNote,
} from "./notes.service.js";

// Same {error:{message,code}} shape auth.routes.ts already established
// (SPEC-008 -> "Reuse and generalization") — kept local rather than
// extracted into a shared module, since this is still the only other
// place that needs it (extraction bar is >=2 real, independent
// consumers wanting the *same* shared code, not just the same shape).
function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { message, code } });
}

// Reuses auth.rate-limit.ts's existing "authenticated-only mutating
// action" limiter rather than defining a new one — that factory is
// already generic (not auth-specific in behavior), and BACKLOG-006's own
// precedent (TRACE-010: PATCH /me got this same limiter once it became
// a mutating authenticated route) is that every mutating authenticated
// route gets this consistent posture, not just the original auth ones.
const isTestRun = env.nodeEnv === "test";
const notesMutationRateLimit = createProfileRateLimit({ skip: () => isTestRun });

export const notesRouter: Router = Router();

notesRouter.use(requireAuth);

notesRouter.get("/", async (req, res) => {
  const notes = await listNotes(req.userId as string);
  res.status(200).json({ notes });
});

notesRouter.post("/", notesMutationRateLimit, async (req, res) => {
  try {
    const { title, body } = createNoteRequestSchema.parse(req.body);
    const note = await createNote(req.userId as string, title, body);
    res.status(201).json({ note: toNoteSummary(note) });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid note data.");
      return;
    }
    throw err;
  }
});

notesRouter.get("/:id", async (req, res) => {
  const noteIdParam = typeof req.params.id === "string" ? req.params.id : "";
  const note = await getOwnedNote(noteIdParam, req.userId as string);
  if (!note) {
    sendError(res, 404, "NOTE_NOT_FOUND", "Note not found.");
    return;
  }
  res.status(200).json({ note: toNoteSummary(note) });
});

notesRouter.patch("/:id", notesMutationRateLimit, async (req, res) => {
  try {
    const updates = updateNoteRequestSchema.parse(req.body);
    const noteIdParam = typeof req.params.id === "string" ? req.params.id : "";
    const note = await updateOwnedNote(noteIdParam, req.userId as string, updates);
    if (!note) {
      sendError(res, 404, "NOTE_NOT_FOUND", "Note not found.");
      return;
    }
    res.status(200).json({ note: toNoteSummary(note) });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid note data.");
      return;
    }
    throw err;
  }
});

notesRouter.delete("/:id", notesMutationRateLimit, async (req, res) => {
  const noteIdParam = typeof req.params.id === "string" ? req.params.id : "";
  const deleted = await deleteOwnedNote(noteIdParam, req.userId as string);
  if (!deleted) {
    sendError(res, 404, "NOTE_NOT_FOUND", "Note not found.");
    return;
  }
  res.status(204).end();
});
