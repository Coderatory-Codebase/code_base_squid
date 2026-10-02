import type { ReactElement } from "react";
import { LogIn } from "lucide-react";
import { PageHeader, PageShell } from "@workspace/ui";
import { signIn } from "@/features/auth/auth.actions";

type SignInPageProps = Readonly<{ searchParams: Promise<Readonly<{ error?: string }>> }>;

const SignInPage = async ({ searchParams }: SignInPageProps): Promise<ReactElement> => {
  const { error } = await searchParams;
  return (
    <PageShell width="narrow">
      <PageHeader description="Sign in to see the organizations connected to your workspaces." eyebrow="Workspace" icon={<LogIn aria-hidden="true" className="size-5" />} title="Welcome back" />
      <form action={signIn} className="grid gap-4 rounded-xl border bg-card p-6">
        {error ? <p aria-live="polite" className="text-sm text-destructive">{error === "credentials" ? "Email or password is incorrect." : "Sign in is temporarily unavailable. Try again."}</p> : null}
        <label className="grid gap-2 text-sm font-medium" htmlFor="email">
          Email
          <input autoComplete="email" className="h-10 rounded-md border bg-background px-3 font-normal" id="email" name="email" required type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="password">
          Password
          <input autoComplete="current-password" className="h-10 rounded-md border bg-background px-3 font-normal" id="password" name="password" required type="password" />
        </label>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Sign in</button>
      </form>
    </PageShell>
  );
};

export default SignInPage;
