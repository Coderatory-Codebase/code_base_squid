export type IdentityProvider = "google" | "microsoft";

export type VerifiedIdentity = Readonly<{
  provider: IdentityProvider;
  subject: string;
  email: string;
  displayName: string;
}>;