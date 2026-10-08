import type { ReactElement } from "react";
import { KeyRound } from "lucide-react";
import { Button, PageHeader, PageShell } from "@workspace/ui";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { signIn } from "@/features/auth/auth.actions";

type SignInPageProps = Readonly<{
  searchParams: Promise<Readonly<{ error?: string | readonly string[]; returnTo?: string }>>;
}>;

type SignInError = Readonly<{ title: string; description: string }>;

const signInErrors: Readonly<Record<string, SignInError>> = Object.freeze({
  credentials: { title: "Email or password is incorrect", description: "Check your credentials and try again." },
  "provider-unavailable": { title: "Sign-in provider unavailable", description: "Google or Microsoft could not complete sign-in. Try again in a moment." },
  "invalid-sign-in": { title: "Sign-in was cancelled or could not be verified", description: "No account or session was created. Choose a provider to sign in again." },
  "account-closed": { title: "This account is closed", description: "Contact your organization administrator for help." }
});

const SignInPage = async ({ searchParams }: SignInPageProps): Promise<ReactElement> => {
  const parameters = await searchParams;
  const errorCode = typeof parameters.error === "string" ? parameters.error : undefined;
  const error = errorCode ? signInErrors[errorCode] : undefined;
  const apiBaseUrl = createApiConfiguration(readWebEnvironment()).baseUrl.replace(/\/$/, "");

  return (
    <PageShell className="justify-center" width="narrow">
      <PageHeader description="Sign in to see the organizations connected to your workspaces." eyebrow="Workspace" icon={<KeyRound aria-hidden="true" className="size-5" />} title="Welcome back" />
      {error ? <section aria-live="polite" className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-4" role="alert"><h2 className="font-semibold">{error.title}</h2><p className="text-sm">{error.description}</p></section> : null}
      <section aria-label="Sign-in providers" className="mt-6 grid gap-3">
        <Button asChild size="lg"><a href={`${apiBaseUrl}/identity/sign-in/google`}>Continue with Google</a></Button>
        <Button asChild size="lg" variant="outline"><a href={`${apiBaseUrl}/identity/sign-in/microsoft`}>Continue with Microsoft</a></Button>
      </section>
      <p className="my-4 text-center text-sm text-muted-foreground">Or sign in with your email and password</p>
      <form action={signIn} className="grid gap-4 rounded-xl border bg-card p-6">
        {typeof parameters.returnTo === "string" && parameters.returnTo.startsWith("/workspace/invitations/accept?token=") ? <input name="returnTo" type="hidden" value={parameters.returnTo} /> : null}
        <label className="grid gap-2 text-sm font-medium" htmlFor="email">Email<input autoComplete="email" className="h-10 rounded-md border bg-background px-3 font-normal" id="email" name="email" required type="email" /></label>
        <label className="grid gap-2 text-sm font-medium" htmlFor="password">Password<input autoComplete="current-password" className="h-10 rounded-md border bg-background px-3 font-normal" id="password" name="password" required type="password" /></label>
        <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Sign in</button>
      </form>
    </PageShell>
  );
};

export default SignInPage;
