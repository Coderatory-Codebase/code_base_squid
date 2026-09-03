"use client";

import { useEffect, useState } from "react";
import {
  listSessions,
  revokeOtherSessions,
  revokeSession,
  type SessionSummary,
} from "@/lib/auth-client";

export function SessionList() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    try {
      setSessions(await listSessions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleRevoke(id: string) {
    setPendingId(id);
    setError(null);
    try {
      await revokeSession(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke session.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRevokeOthers() {
    setPendingId("others");
    setError(null);
    try {
      await revokeOtherSessions();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke other sessions.");
    } finally {
      setPendingId(null);
    }
  }

  const hasOtherSessions = (sessions ?? []).some((session) => !session.isCurrent);

  return (
    <section aria-label="Active sessions">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {sessions === null && <p>Loading sessions…</p>}
      {sessions !== null && (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              <span>{session.userAgent ?? "Unknown device"}</span>
              {session.isCurrent && <strong> (this device)</strong>}
              <br />
              <small>Last used {new Date(session.lastUsedAt).toLocaleString()}</small>
              {!session.isCurrent && (
                <button
                  type="button"
                  disabled={pendingId === session.id}
                  onClick={() => void handleRevoke(session.id)}
                >
                  {pendingId === session.id ? "Revoking…" : "Log out this device"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasOtherSessions && (
        <button
          type="button"
          disabled={pendingId === "others"}
          onClick={() => void handleRevokeOthers()}
        >
          {pendingId === "others" ? "Revoking…" : "Log out all other devices"}
        </button>
      )}
    </section>
  );
}
