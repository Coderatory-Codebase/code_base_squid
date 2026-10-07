"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui";
import { z } from "zod";
import { getDisplayNameValidationMessage } from "../display-name-validation";

type UserProfileEditorProps = Readonly<{ email: string; name: string; version: number }>;
const ConflictResponseSchema = z.object({
  error: z.object({
    details: z.object({
      currentProfile: z.object({ email: z.string().email(), name: z.string().min(1).max(80), version: z.number().int().nonnegative() })
    })
  })
});

export const UserProfileEditor = ({ email, name: initialName, version: initialVersion }: UserProfileEditorProps): ReactElement => {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [version, setVersion] = useState(initialVersion);
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const previousName = name;
    const nextName = name.trim();
    const validationMessage = getDisplayNameValidationMessage(nextName);
    if (validationMessage) {
      setNameError(validationMessage);
      setMessage("");
      return;
    }
    setNameError("");
    setName(nextName);
    setSaving(true);
    setMessage("Saving profile…");
    try {
      const response = await fetch("/api/identity/user-profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nextName, version })
      });
      if (response.status === 409) {
        const conflict = ConflictResponseSchema.safeParse(await response.json());
        if (conflict.success) {
          const current = conflict.data.error.details.currentProfile;
          setName(current.name);
          setVersion(current.version);
          setMessage(`Your profile changed in another session. The current display name is ${current.name}.`);
        } else {
          setName(previousName);
          setMessage("Your profile changed in another session. Reload this page before saving again.");
        }
        return;
      }
      if (!response.ok) {
        setName(previousName);
        setMessage("Could not save your display name. Please try again.");
        return;
      }
      const updated = await response.json() as { name: string; version: number };
      setName(updated.name);
      setVersion(updated.version);
      setMessage("Display name saved.");
    } catch {
      setName(previousName);
      setMessage("Could not reach the profile service. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setSaving(true);
    try {
      await fetch("/api/identity/session", { method: "DELETE" });
    } finally {
      router.push("/sign-in");
    }
  };

  return (
    <div className="mt-8 grid gap-8">
      <form className="grid max-w-md gap-3" noValidate onSubmit={(event) => void save(event)}>
        <label className="grid gap-2 text-sm font-medium" htmlFor="email-address">
          Email address
          <input
            autoComplete="email"
            className="h-10 rounded-md border border-input bg-muted px-3 text-base text-muted-foreground"
            id="email-address"
            readOnly
            type="email"
            value={email}
            aria-describedby="email-source"
          />
        </label>
        <p className="text-sm text-muted-foreground" id="email-source">Email is managed by Google or Microsoft and cannot be changed here.</p>
        <label className="grid gap-2 text-sm font-medium" htmlFor="display-name">
          Display name
          <input
            autoComplete="name"
            className="h-10 rounded-md border border-input bg-background px-3 text-base"
            id="display-name"
            aria-describedby={nameError ? "display-name-error" : undefined}
            aria-invalid={nameError ? true : undefined}
            maxLength={81}
            onChange={(event) => {
              setName(event.currentTarget.value);
              setNameError("");
            }}
            value={name}
          />
        </label>
        {nameError ? <p className="text-sm text-destructive" id="display-name-error">{nameError}</p> : null}
        <div><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save changes"}</Button></div>
        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{message}</p>
      </form>
      <div><Button disabled={saving} onClick={() => void signOut()} type="button" variant="outline">Sign out</Button></div>
    </div>
  );
};
