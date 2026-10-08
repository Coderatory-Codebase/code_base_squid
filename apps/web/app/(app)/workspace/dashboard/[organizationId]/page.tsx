import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Activity, Building2, UsersRound } from "lucide-react";
import { PageHeader, PageShell } from "@workspace/ui";
import { getOrganizationDashboard } from "@/features/organizations/dashboard.gateway";
import { InviteMemberForm } from "@/features/organizations/invite-member-form";
import { removeOrganizationMember, updateOrganizationMemberRole } from "@/features/organizations/team.actions";

type DashboardPageProps = Readonly<{
  params: Promise<Readonly<{ organizationId: string }>>;
  searchParams: Promise<Readonly<{ teamError?: string }>>;
}>;

const errorMessages: Readonly<Record<string, string>> = {
  forbidden: "Your role does not allow that team-management action.",
  invalid: "The team-management request was invalid.",
  remove: "The member could not be removed. Refresh the page and try again.",
  service: "The team service could not be reached. Try again.",
  update: "The member role could not be updated. Refresh the page and try again."
};

const activityLabel: Readonly<Record<string, string>> = {
  invitation_sent: "Invitation created for",
  invitation_accepted: "Invitation accepted by",
  member_role_changed: "Role changed for",
  member_removed: "Member removed"
};

const WorkspaceDashboardPage = async ({ params, searchParams }: DashboardPageProps): Promise<ReactElement> => {
  const [{ organizationId }, { teamError }] = await Promise.all([params, searchParams]);
  if (!/^[a-f\d]{24}$/iu.test(organizationId)) notFound();
  const token = (await cookies()).get("workspace_session")?.value;
  if (!token) redirect("/sign-in");
  const result = await getOrganizationDashboard(organizationId, token);
  if (!result.ok && result.status === 401) redirect("/sign-in");
  if (!result.ok && result.status === 404) notFound();
  if (!result.ok) {
    return (
      <PageShell>
        <PageHeader description="Live organization team and workspace overview." eyebrow="Workspace dashboard" icon={<Building2 aria-hidden="true" className="size-5" />} title="Dashboard unavailable" />
        <section aria-live="polite" className="rounded-xl border border-destructive/30 bg-card p-6" role="alert">
          <p>{result.message}</p>
          <a className="mt-4 inline-block underline" href={`/workspace/dashboard/${encodeURIComponent(organizationId)}`}>Try again</a>
        </section>
      </PageShell>
    );
  }
  const { dashboard } = result;
  const canManage = dashboard.viewerRole === "owner" || dashboard.viewerRole === "admin";
  return (
    <PageShell>
      <PageHeader
        description="Current team access, linked workspaces, and recent team activity."
        eyebrow="Workspace dashboard"
        icon={<Building2 aria-hidden="true" className="size-5" />}
        title={dashboard.organization.name}
      />
      <nav aria-label="Workspace navigation" className="mb-6 flex flex-wrap gap-4 text-sm">
        <a className="underline" href="/workspace/organization">All organizations</a>
        <span aria-current="page">Dashboard</span>
      </nav>
      {teamError && errorMessages[teamError]
        ? <p aria-live="polite" className="mb-5 rounded-md border border-destructive/30 p-3 text-sm text-destructive" role="alert">{errorMessages[teamError]}</p>
        : null}
      <section aria-label="Organization metrics" className="mb-8 grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><UsersRound aria-hidden="true" className="size-4" />Active team members</div>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{dashboard.metrics.activeTeamMembers}</p>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 aria-hidden="true" className="size-4" />Linked workspaces</div>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{dashboard.metrics.linkedWorkspaces}</p>
          <p className="mt-1 text-xs text-muted-foreground">Count of workspaces currently linked to this organization.</p>
        </article>
      </section>
      <section aria-labelledby="team-members-heading" className="mb-8 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold" id="team-members-heading">Team members</h2>
        <ul className="mt-4 divide-y">
          {dashboard.members.map((member) => (
            <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={member.userId}>
              <div>
                <p className="font-medium">{member.email ?? "Organization owner"}</p>
                <p className="text-sm text-muted-foreground">{member.role === "owner" ? "Owner" : member.role === "admin" ? "Admin" : "Member"}</p>
              </div>
              {canManage && member.role !== "owner" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <form action={updateOrganizationMemberRole} className="flex items-center gap-2">
                    <input name="organizationId" type="hidden" value={organizationId} />
                    <input name="memberId" type="hidden" value={member.userId} />
                    <label className="sr-only" htmlFor={`role-${member.userId}`}>Role for {member.email ?? "team member"}</label>
                    <select className="h-9 rounded-md border bg-background px-2 text-sm" defaultValue={member.role} id={`role-${member.userId}`} name="role">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button className="h-9 rounded-md border px-3 text-sm font-medium" type="submit">Update role</button>
                  </form>
                  <form action={removeOrganizationMember}>
                    <input name="organizationId" type="hidden" value={organizationId} />
                    <input name="memberId" type="hidden" value={member.userId} />
                    <button aria-label={`Remove ${member.email ?? "team member"}`} className="h-9 rounded-md border border-destructive/40 px-3 text-sm text-destructive" type="submit">Remove</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {canManage ? <InviteMemberForm organizationId={organizationId} /> : null}
      <section aria-labelledby="recent-activity-heading" className="mt-8 rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Activity aria-hidden="true" className="size-4" />
          <h2 className="text-xl font-semibold" id="recent-activity-heading">Recent team activity</h2>
        </div>
        {dashboard.activity.length > 0 ? (
          <ol className="mt-4 grid gap-3">
            {dashboard.activity.map((event, index) => (
              <li className="rounded-md border p-3 text-sm" key={`${event.action}-${event.createdAt}-${index}`}>
                <p>{activityLabel[event.action] ?? "Team activity"} {event.target}{event.actorEmail ? ` by ${event.actorEmail}` : ""}</p>
                <time className="mt-1 block text-xs text-muted-foreground" dateTime={event.createdAt}>
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Team changes will appear here.</p>
        )}
      </section>
    </PageShell>
  );
};

export default WorkspaceDashboardPage;
