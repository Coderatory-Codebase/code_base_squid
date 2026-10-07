export type WorkspaceMembershipRecord = Readonly<{
  workspaceId: string;
  userId: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "REMOVED";
  guest: boolean;
  version: number;
}>;

export type WorkspaceMembershipContext = Readonly<{ workspaceId: string }>;
export type WorkspaceMembershipPort = Readonly<{
  activeMembershipsFor: (userId: string) => Promise<readonly WorkspaceMembershipContext[]>;
}>;