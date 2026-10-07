"use client";

import { useActionState, useOptimistic, useState, useTransition, type ReactElement } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui";
import {
  initialOrganizationSetupState,
  type OrganizationSetupActionState
} from "./organization-setup.state";

type OrganizationSetupAction = (
  previousState: OrganizationSetupActionState,
  formData: FormData
) => Promise<OrganizationSetupActionState>;

type OrganizationSetupFormProps = Readonly<{
  action: OrganizationSetupAction;
  initialState?: OrganizationSetupActionState;
}>;

const getFeedback = (state: OrganizationSetupActionState): string | null => {
  if (state.status === "invalid" || state.status === "failure") return state.message;
  if (state.status === "conflict") {
    return state.currentName
      ? `The current organization name is "${state.currentName}". Review the name and submit again.`
      : "The organization changed while you were setting it up. Review the current value and submit again.";
  }
  return null;
};

export const OrganizationSetupForm = ({ action, initialState = initialOrganizationSetupState }: OrganizationSetupFormProps): ReactElement => {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [optimisticName, setOptimisticName] = useOptimistic("", (_currentName, nextName: string) => nextName);
  const [clientNameError, setClientNameError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const feedback = clientNameError ?? getFeedback(state);
  const invalidName = clientNameError !== null || state.status === "invalid";

  const submit = (formData: FormData): void => {
    const submittedName = formData.get("name");
    startTransition(async () => {
      setOptimisticName(typeof submittedName === "string" ? submittedName.trim() : "");
      await formAction(formData);
    });
  };

  return (
    <form action={submit} className="grid gap-4 rounded-xl border bg-card p-6">
      <p
        aria-live="polite"
        className={feedback ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        id="organization-setup-feedback"
        role="status"
      >
        {pending && optimisticName ? `Creating ${optimisticName}...` : feedback}
      </p>
      <label className="grid gap-2 text-sm font-medium" htmlFor="name">
        Organization name
        <input
          aria-describedby={feedback ? "organization-setup-feedback" : undefined}
          aria-invalid={invalidName}
          autoComplete="organization"
          className={`h-10 rounded-md border bg-background px-3 font-normal${invalidName ? " border-destructive" : ""}`}
          id="name"
          maxLength={81}
          minLength={1}
          name="name"
          onChange={() => setClientNameError(null)}
          onInvalid={(event) => {
            event.preventDefault();
            setClientNameError(event.currentTarget.value.trim()
              ? "Organization names must be 80 characters or fewer."
              : "Enter an organization name.");
          }}
          required
        />
      </label>
      <div className="flex items-center gap-3">
        <Button disabled={pending} type="submit">{pending ? "Creating..." : "Create organization"}</Button>
        <Button asChild variant="outline"><Link href="/workspace/organization">Cancel</Link></Button>
      </div>
    </form>
  );
};
