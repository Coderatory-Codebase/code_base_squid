import type { ReactElement } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/primitives";
import { signInToTemporaryBrandingDemo } from "./actions";

type LoginPageProps = Readonly<{ searchParams: Promise<Readonly<{ error?: string }>> }>;

const OrganizationBrandingLoginPage = async ({ searchParams }: LoginPageProps): Promise<ReactElement> => {
  const { error } = await searchParams;
  const demoEnabled = process.env.TEMP_ORG_BRANDING_DEMO_ENABLED === "true";
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
      <Card className="w-full rounded-3xl">
        <CardHeader>
          <CardTitle>Organization branding demo</CardTitle>
          <CardDescription>Sign in with the temporary local demo credentials configured for this workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {!demoEnabled ? <p className="text-sm text-muted-foreground">Temporary demo login is disabled. Enable it in the local web environment and configure the matching API settings.</p> : (
            <>
              {error === "credentials" && <p className="mb-4 text-sm text-destructive" role="alert">Enter your demo email and password.</p>}
              {error === "unavailable" && <p className="mb-4 text-sm text-destructive" role="alert">Demo sign-in failed. Check that the local API is running and the demo credentials match.</p>}
              <form action={signInToTemporaryBrandingDemo} className="space-y-4">
                <label className="block space-y-2 text-sm font-medium" htmlFor="email">Email
                  <input autoComplete="username" className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal" id="email" name="email" required type="email" />
                </label>
                <label className="block space-y-2 text-sm font-medium" htmlFor="password">Password
                  <input autoComplete="current-password" className="w-full rounded-md border border-input bg-background px-3 py-2 font-normal" id="password" name="password" required type="password" />
                </label>
                <button className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground" type="submit">Sign in</button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default OrganizationBrandingLoginPage;
