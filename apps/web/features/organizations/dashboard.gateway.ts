import { createApiConfiguration, readWebEnvironment } from "@/config";

export type TeamRole = "owner" | "admin" | "member";
export type DashboardMember = Readonly<{
  userId: string;
  email: string | null;
  role: TeamRole;
  joinedAt: string | null;
}>;
export type DashboardActivity = Readonly<{
  actorId: string;
  actorEmail: string | null;
  action: "invitation_sent" | "invitation_accepted" | "member_role_changed" | "member_removed";
  target: string;
  createdAt: string;
}>;
export type OrganizationDashboard = Readonly<{
  organization: Readonly<{ id: string; name: string }>;
  metrics: Readonly<{ activeTeamMembers: number; linkedWorkspaces: number }>;
  viewerRole: TeamRole;
  members: readonly DashboardMember[];
  activity: readonly DashboardActivity[];
}>;
export type OrganizationDashboardResult =
  | Readonly<{ ok: true; dashboard: OrganizationDashboard }>
  | Readonly<{ ok: false; status: number; message: string }>;

type DashboardGatewayDependencies = Readonly<{
  getApiBaseUrl?: () => string;
  fetchApi?: typeof fetch;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseDashboard = (value: unknown): OrganizationDashboard | null => {
  if (!isRecord(value) || !isRecord(value.organization) || !isRecord(value.metrics)) return null;
  if (typeof value.organization.id !== "string" || typeof value.organization.name !== "string") return null;
  if (!Number.isInteger(value.metrics.activeTeamMembers) || !Number.isInteger(value.metrics.linkedWorkspaces)) return null;
  if (!(value.viewerRole === "owner" || value.viewerRole === "admin" || value.viewerRole === "member")) return null;
  if (!Array.isArray(value.members) || !Array.isArray(value.activity)) return null;
  const members: DashboardMember[] = [];
  for (const valueMember of value.members) {
    if (!isRecord(valueMember)
      || typeof valueMember.userId !== "string"
      || !(valueMember.email === null || typeof valueMember.email === "string")
      || !(valueMember.role === "owner" || valueMember.role === "admin" || valueMember.role === "member")
      || !(valueMember.joinedAt === null || typeof valueMember.joinedAt === "string")) return null;
    members.push({
      userId: valueMember.userId,
      email: valueMember.email,
      role: valueMember.role,
      joinedAt: valueMember.joinedAt
    });
  }
  const actions = ["invitation_sent", "invitation_accepted", "member_role_changed", "member_removed"] as const;
  const activity: DashboardActivity[] = [];
  for (const valueEvent of value.activity) {
    if (!isRecord(valueEvent)
      || typeof valueEvent.actorId !== "string"
      || !(!("actorEmail" in valueEvent) || valueEvent.actorEmail === null || typeof valueEvent.actorEmail === "string")
      || !actions.includes(valueEvent.action as typeof actions[number])
      || typeof valueEvent.target !== "string"
      || typeof valueEvent.createdAt !== "string") return null;
    activity.push({
      actorId: valueEvent.actorId,
      actorEmail: typeof valueEvent.actorEmail === "string" ? valueEvent.actorEmail : null,
      action: valueEvent.action as DashboardActivity["action"],
      target: valueEvent.target,
      createdAt: valueEvent.createdAt
    });
  }
  return {
    organization: { id: value.organization.id, name: value.organization.name },
    metrics: {
      activeTeamMembers: value.metrics.activeTeamMembers as number,
      linkedWorkspaces: value.metrics.linkedWorkspaces as number
    },
    viewerRole: value.viewerRole,
    members,
    activity
  };
};

export const createDashboardGateway = ({
  getApiBaseUrl = () => createApiConfiguration(readWebEnvironment()).baseUrl,
  fetchApi = fetch
}: DashboardGatewayDependencies = {}) => ({
  getDashboard: async (organizationId: string, token: string): Promise<OrganizationDashboardResult> => {
    try {
      const response = await fetchApi(new URL(`/organizations/${encodeURIComponent(organizationId)}/dashboard`, getApiBaseUrl()), {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          message: `The organization dashboard could not be loaded (HTTP ${response.status}).`
        };
      }
      const dashboard = parseDashboard(await response.json());
      return dashboard
        ? { ok: true, dashboard }
        : { ok: false, status: 502, message: "The organization dashboard service returned an invalid response." };
    } catch {
      return { ok: false, status: 503, message: "The organization dashboard service could not be reached." };
    }
  }
});

export const getOrganizationDashboard = (organizationId: string, token: string): Promise<OrganizationDashboardResult> =>
  createDashboardGateway().getDashboard(organizationId, token);
