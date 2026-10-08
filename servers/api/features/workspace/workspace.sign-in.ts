import type {
  WorkspaceBootstrapInput,
  WorkspaceBootstrapResult,
  VerifiedWorkspaceIdentity
} from "./workspace.bootstrap.js";

export type WorkspaceIdentityVerifier = (credential: string) => Promise<VerifiedWorkspaceIdentity>;

export type WorkspaceSignInInput = Omit<WorkspaceBootstrapInput, "identity"> & Readonly<{
  credential: string;
}>;

type WorkspaceBootstrap = (input: WorkspaceBootstrapInput) => Promise<WorkspaceBootstrapResult>;

export const createWorkspaceSignInCallback = ({
  verifyIdentity,
  bootstrap
}: Readonly<{
  verifyIdentity: WorkspaceIdentityVerifier;
  bootstrap: WorkspaceBootstrap;
}>) => async ({ credential, ...input }: WorkspaceSignInInput): Promise<WorkspaceBootstrapResult> => {
  const identity = await verifyIdentity(credential);
  return bootstrap({ ...input, identity });
};
