export type WorkspaceCreation = Readonly<{
  name: string;
}>;

export type WorkspaceCreationError = Readonly<{
  kind: "invalid-name";
  message: string;
}>;

export type WorkspaceCreationResult =
  | Readonly<{ ok: true; value: WorkspaceCreation }>
  | Readonly<{ ok: false; error: WorkspaceCreationError }>;

const INVALID_NAME: WorkspaceCreationError = {
  kind: "invalid-name",
  message: "Workspace name must contain between 1 and 80 characters."
};

/** Builds a valid workspace creation request without performing persistence. */
export const createWorkspaceCreation = (
  input: WorkspaceCreation
): WorkspaceCreationResult => {
  const name = input.name.trim();
  if (name.length === 0 || name.length > 80) {
    return { ok: false, error: INVALID_NAME };
  }

  return {
    ok: true,
    value: { name }
  };
};
