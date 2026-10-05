import type { ReactElement } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui";

type OrganizationSetupFormProps = Readonly<{
  action: (formData: FormData) => void | Promise<void>;
  error?: string | undefined;
}>;

export const OrganizationSetupForm = ({ action, error }: OrganizationSetupFormProps): ReactElement => (
  <form action={action} className="grid gap-4 rounded-xl border bg-card p-6">
    {error ? <p aria-live="polite" className="text-sm text-destructive">{error === "name" ? "Enter an organization name." : "The organization could not be created. Try again."}</p> : null}
    <label className="grid gap-2 text-sm font-medium" htmlFor="name">
      Organization name
      <input autoComplete="organization" className="h-10 rounded-md border bg-background px-3 font-normal" id="name" maxLength={80} name="name" required />
    </label>
    <div className="flex items-center gap-3">
      <Button type="submit">Create organization</Button>
      <Button asChild variant="outline"><Link href="/workspace/organization">Cancel</Link></Button>
    </div>
  </form>
);
