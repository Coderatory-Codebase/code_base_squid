import { Note, type NoteDocument } from "./notes.model.js";
import type { NoteSummary, UpdateNoteRequest } from "./notes.contracts.js";

export function toNoteSummary(note: NoteDocument): NoteSummary {
  return {
    id: note.id as string,
    title: note.title,
    body: note.body ?? "",
    createdAt: (note.createdAt as Date).toISOString(),
    updatedAt: (note.updatedAt as Date).toISOString(),
  };
}

export async function createNote(
  userId: string,
  title: string,
  body: string | undefined,
): Promise<NoteDocument> {
  return Note.create({ userId, title, body });
}

export async function listNotes(userId: string): Promise<NoteSummary[]> {
  const notes = await Note.find({ userId }).sort({ createdAt: -1 });
  return notes.map(toNoteSummary);
}

export async function getOwnedNote(noteId: string, userId: string): Promise<NoteDocument | null> {
  return Note.findOne({ _id: noteId, userId });
}

export async function updateOwnedNote(
  noteId: string,
  userId: string,
  updates: UpdateNoteRequest,
): Promise<NoteDocument | null> {
  return Note.findOneAndUpdate({ _id: noteId, userId }, updates, {
    returnDocument: "after",
    runValidators: true,
  });
}

export async function deleteOwnedNote(noteId: string, userId: string): Promise<boolean> {
  const result = await Note.deleteOne({ _id: noteId, userId });
  return result.deletedCount > 0;
}
