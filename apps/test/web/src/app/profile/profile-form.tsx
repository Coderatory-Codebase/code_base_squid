"use client";

import { useState, type FormEvent } from "react";
import { updateProfile, type AuthUser } from "@/lib/auth-client";

export function ProfileForm({ user }: { user: AuthUser }) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateProfile(displayName);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" value={user.email} disabled />
      </label>
      <label>
        Display name
        <input
          type="text"
          required
          minLength={1}
          maxLength={60}
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite">
        {saved ? "Saved." : ""}
      </p>
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
