"use client";

// Local, independently maintained types for what apps/web consumes from
// servers/api's /api/notes/* endpoints — the two deployables don't share
// source (ADR-012 -> "Contract placement").
export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteErrorBody {
  error: { message: string; code: string };
}

async function readErrorMessage(res: globalThis.Response, fallback: string): Promise<string> {
  const data = (await res.json()) as NoteErrorBody;
  return data.error?.message ?? fallback;
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes", { credentials: "include" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not load notes."));
  }
  const data = (await res.json()) as { notes: Note[] };
  return data.notes;
}

export async function createNote(title: string, body: string): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body: body || undefined }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not create note."));
  }
  const data = (await res.json()) as { note: Note };
  return data.note;
}

export async function updateNote(id: string, title: string, body: string): Promise<Note> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not update note."));
  }
  const data = (await res.json()) as { note: Note };
  return data.note;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not delete note."));
  }
}
