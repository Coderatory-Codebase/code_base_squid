export type IdentitySignal =
  | Readonly<{
      event: "identity.sign_in.completion";
      module: "identity";
      operation: "sign_in.completion";
      workspaceId: string | null;
      outcome: "success" | "error";
      durationMs: number;
    }>
  | Readonly<{
      event: "identity.user_profile.gateway_query";
      module: "identity";
      operation: "user_profile.gateway_query";
      workspaceId: string;
      outcome: "success" | "not_found" | "error";
      durationMs: number;
    }>;
