import type { Principal } from "../../../types/index.js";
import type { MembersGateway } from "../db/members.gateway.js";
import {
  transitionOrganizationLifecycle,
  type OrganizationLifecycle,
  type OrganizationLifecycleAction
} from "../domain/organization-lifecycle.js";
import { decideOrganizationLifecycle } from "../policies/organization-lifecycle.policy.js";

export type OrganizationLifecycleCommandResult =
  | Readonly<{ ok: true; lifecycle: OrganizationLifecycle }>
  | Readonly<{ ok: false; code: "invalid" | "forbidden" | "not_found"; message: string }>
  | Readonly<{ ok: false; code: "conflict"; message: string; current: OrganizationLifecycle }>;

export type OrganizationLifecycleService = Readonly<{
  transition: (
    organizationId: string,
    principal: Principal,
    action: OrganizationLifecycleAction,
    expectedVersion: number
  ) => Promise<OrganizationLifecycleCommandResult>;
}>;

export const createOrganizationLifecycleService = (
  gateway: MembersGateway
): OrganizationLifecycleService => ({
  transition: async (organizationId, principal, action, expectedVersion) => {
    const record = await gateway.getOrganizationLifecycle(organizationId, principal);
    if (!record) return { ok: false, code: "not_found", message: "The organization was not found." };

    const decision = decideOrganizationLifecycle(principal, record.ownerId, action);
    if (!decision.allowed || decision.subjectId !== principal.userId || decision.action !== `organization:${action}`) {
      return { ok: false, code: "forbidden", message: "Only the organization owner can change its lifecycle." };
    }

    const now = new Date();
    const proposed = transitionOrganizationLifecycle(record.lifecycle, action, expectedVersion, principal.userId, now);
    if (!proposed.ok) return { ok: false, ...proposed.error };

    const lifecycle = await gateway.transitionOrganizationLifecycle(
      organizationId,
      record.ownerId,
      expectedVersion,
      action,
      principal.userId,
      now
    );
    if (lifecycle) return { ok: true, lifecycle };

    const latest = await gateway.getOrganizationLifecycle(organizationId, principal);
    if (latest && latest.ownerId === record.ownerId) {
      return {
        ok: false,
        code: "conflict",
        message: "The organization changed while this request was being saved. Review its current state.",
        current: latest.lifecycle
      };
    }
    return { ok: false, code: "not_found", message: "The organization was not found." };
  }
});
