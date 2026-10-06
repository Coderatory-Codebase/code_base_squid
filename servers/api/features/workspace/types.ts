// TEMPORARY: minimal Principal shape until the real Auth module (M03.3) exists.
// Replace with the shared Principal type from the Auth feature once it lands.
export type Principal = Readonly<{
  userId: string;
  workspaceIds: readonly string[];
}>;
