import type { ReactElement } from "react";
import { KeyRound } from "lucide-react";
import { Button, PageHeader, PageShell } from "@workspace/ui";
import { createApiConfiguration, readWebEnvironment } from "@/config";

type SignInPageProps = Readonly<{
  searchParams: Promise<Readonly<{ error?: string | readonly string[] }>>;
}>;

type SignInError = Readonly<{ title: string; description: string }>;

const signInErrors: Readonly<Record<string, SignInError>> = Object.freeze({
  "provider-unavailable": {
    title: "Sign-in provider unavailable",
    description: "Google or Microsoft could not complete sign-in. Try again in a moment."
  },
  "invalid-sign-in": {
    title: "Sign-in was cancelled or could not be verified",
    description: "No account or session was created. Choose a provider to sign in again."
  },
  "account-closed": {
    title: "This account is closed",
    description: "This account cannot sign in. Contact your organization administrator for help."
  }
});

const SignInPage = async ({ searchParams }: SignInPageProps): Promise<ReactElement> => {
  const parameters = await searchParams;
  const errorCode = typeof parameters.error === "string" ? parameters.error : undefined;
  const error = errorCode ? signInErrors[errorCode] : undefined;
  const api = createApiConfiguration(readWebEnvironment());
  const apiBaseUrl = api.baseUrl.replace(/\/$/, "");

  return (
    <PageShell className="justify-center" width="narrow">
      <PageHeader
        description="Use your work account to sign in. Your first sign-in creates your Squid account and organization."
        eyebrow="Welcome to Squid"
        icon={<KeyRound aria-hidden="true" className="size-5" />}
        title="Sign in or create your account"
      />
      {error ? (
        <section aria-labelledby="sign-in-error-title" className="mt-8 rounded-md border border-destructive/40 bg-destructive/5 p-4" role="alert">
          <h2 className="font-semibold text-foreground" id="sign-in-error-title">{error.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{error.description}</p>
        </section>
      ) : null}
      <section aria-label="Sign-in providers" className="mt-8 flex max-w-md flex-col gap-3">
        <Button asChild className="min-h-11" size="lg">
          <a href={`${apiBaseUrl}/identity/sign-in/google`}>Continue with Google</a>
        </Button>
        <Button asChild className="min-h-11" size="lg" variant="outline">
          <a href={`${apiBaseUrl}/identity/sign-in/microsoft`}>Continue with Microsoft</a>
        </Button>
        <p className="pt-2 text-sm leading-6 text-muted-foreground">
          Squid does not store a separate password. Your provider verifies your identity.
        </p>
      </section>
    </PageShell>
  );
};

export default SignInPage;
