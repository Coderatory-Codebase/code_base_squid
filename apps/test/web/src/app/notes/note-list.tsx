"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createNote, deleteNote, listNotes, updateNote, type Note } from "@/lib/notes-client";

export function NoteList() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    try {
      setNotes(await listNotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notes.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createNote(newTitle, newBody);
      setNewTitle("");
      setNewBody("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create note.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditBody(note.body);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setError(null);
    setPendingId(id);
    try {
      await updateNote(id, editTitle, editBody);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update note.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    try {
      await deleteNote(id);
      if (editingId === id) {
        setEditingId(null);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete note.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-label="Notes">
      <h2>New note</h2>
      <form onSubmit={handleCreate}>
        <label>
          Title
          <input
            type="text"
            required
            maxLength={200}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </label>
        <label>
          Body
          <textarea
            maxLength={20000}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />
        </label>
        <button type="submit" disabled={creating}>
          {creating ? "Adding…" : "Add note"}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <h2>Your notes</h2>
      {notes === null && <p>Loading notes…</p>}
      {notes !== null && notes.length === 0 && <p>No notes yet.</p>}
      {notes !== null && notes.length > 0 && (
        <ul className="note-list">
          {notes.map((note) =>
            editingId === note.id ? (
              <li key={note.id}>
                <form onSubmit={(e) => void handleSaveEdit(e, note.id)}>
                  <label>
                    Title
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </label>
                  <label>
                    Body
                    <textarea
                      maxLength={20000}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                  </label>
                  <button type="submit" disabled={pendingId === note.id}>
                    {pendingId === note.id ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={pendingId === note.id}>
                    Cancel
                  </button>
                </form>
              </li>
            ) : (
              <li key={note.id}>
                <h3>{note.title}</h3>
                {note.body && <p>{note.body}</p>}
                <small>Updated {new Date(note.updatedAt).toLocaleString()}</small>
                <br />
                <button type="button" onClick={() => startEdit(note)}>
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pendingId === note.id}
                  onClick={() => void handleDelete(note.id)}
                >
                  {pendingId === note.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
