export type Principal = Readonly<{
  userId: string;
  sessionId: string;
  workspaceId: string;
}>;