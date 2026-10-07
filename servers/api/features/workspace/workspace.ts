import { createWorkspaceCreation } from "./domain/workspace-creation.js";

export type WorkspaceSummary = Readonly<{ workspaceId: string; organizationId: string; name: string }>;

export type WorkspaceLanding =
  | Readonly<{ kind: "ready"; workspace: WorkspaceSummary }>
  | Readonly<{ kind: "create-workspace"; organizationName: string }>;

export type WorkspacePort = Readonly<{
  landingForOwner: (userId: string) => Promise<WorkspaceLanding | null>;
  createForOwner: (input: Readonly<{ userId: string; workspaceId: string; name: string }>) => Promise<WorkspaceSummary | null>;
}>;

export type WorkspaceService = Readonly<{
  landing: (userId: string) => Promise<WorkspaceLanding | null>;
  create: (userId: string, name: string) => Promise<Readonly<{ ok: true; workspace: WorkspaceSummary }> | Readonly<{ ok: false; kind: "invalid-name" | "not-allowed" }>>;
}>;

export const createWorkspaceService = (dependencies: Readonly<{
  workspaces: WorkspacePort;
  createId: () => string;
}>): WorkspaceService => Object.freeze({
  landing: (userId) => dependencies.workspaces.landingForOwner(userId),
  create: async (userId, name) => {
    const creation = createWorkspaceCreation({ name });
    if (!creation.ok) return { ok: false, kind: "invalid-name" };
    const workspace = await dependencies.workspaces.createForOwner({
      userId,
      workspaceId: dependencies.createId(),
      name: creation.value.name
    });
    return workspace ? { ok: true, workspace } : { ok: false, kind: "not-allowed" };
  }
});
