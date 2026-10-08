import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceRepository, type WorkspaceRepositoryDependencies } from "../workspace.repository.js";

const fixtureDate = new Date("2026-01-01T00:00:00.000Z");
const generateTestId = () => Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');

const createFakes = () => {
  const workspacesList: Record<string, unknown>[] = [];
  const membershipsList: Record<string, unknown>[] = [];
  const organizationsList: Record<string, unknown>[] = [];
  const usersList: Record<string, unknown>[] = [];

  let findWorkspacesCalls = 0;
  let findMembershipsCalls = 0;
  let findOrganizationsCalls = 0;

  const workspaces = {
    find: (filter: Record<string, unknown>) => {
      findWorkspacesCalls++;
      return Promise.resolve(workspacesList.filter(w => {
        if (filter.orgId && filter.orgId !== w.orgId) return false;
        if ((filter.deletedAt as Record<string, unknown> | undefined)?.$exists === false && "deletedAt" in w) return false;
        if (filter.status && typeof filter.status === "object" && "$ne" in filter.status && w.status === (filter.status as Record<string, unknown>).$ne) return false;
        return true;
      }));
    },
    findOne: () => Promise.resolve(null)
  };

  const memberships = {
    find: (filter: Record<string, unknown>) => {
      const workspaceFilter = filter.workspaceId as Record<string, unknown> | undefined;
      const workspaceIds = workspaceFilter?.$in;
      return Promise.resolve(membershipsList.filter(m => {
        if (filter.status && filter.status !== m.status) return false;
        if (Array.isArray(workspaceIds) && !workspaceIds.includes(m.workspaceId)) return false;
        if ((filter.deletedAt as Record<string, unknown> | undefined)?.$exists === false && "deletedAt" in m) return false;
        return true;
      }));
    },
    findOne: (filter: Record<string, unknown>) => {
      findMembershipsCalls++;
      return Promise.resolve(membershipsList.find(m => {
        if (filter.userId && filter.userId !== m.userId) return false;
        if (filter.status && filter.status !== m.status) return false;
        if ((filter.deletedAt as Record<string, unknown> | undefined)?.$exists === false && "deletedAt" in m) return false;
        if (filter.workspaceId && typeof filter.workspaceId === "object" && "$in" in filter.workspaceId) {
          const inArr = (filter.workspaceId as Record<string, unknown[]>).$in;
          if (Array.isArray(inArr) && !inArr.includes(m.workspaceId)) return false;
        }
        return true;
      }) || null);
    }
  };

  const organizations = {
    find: () => Promise.resolve([]),
    findOne: (filter: Record<string, unknown>) => {
      findOrganizationsCalls++;
      return Promise.resolve(organizationsList.find(o => {
        if (filter._id && filter._id !== o._id) return false;
        if ((filter.deletedAt as Record<string, unknown> | undefined)?.$exists === false && "deletedAt" in o) return false;
        if (filter.status && typeof filter.status === "object" && "$ne" in filter.status && o.status === (filter.status as Record<string, unknown>).$ne) return false;
        return true;
      }) || null);
    }
  };

  return {
    workspaces,
    memberships,
    organizations,
    userById: (userId: string) => Promise.resolve(usersList.find(user => user._id === userId) as { _id: string; displayName?: string } | undefined ?? null),
    workspacesList,
    membershipsList,
    organizationsList,
    usersList,
    get calls() {
      return { workspaces: findWorkspacesCalls, memberships: findMembershipsCalls, organizations: findOrganizationsCalls };
    }
  };
};

void test("findOrganizationProfile: returns profile for active member", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  const createdAt = fixtureDate;
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt, status: "ACTIVE" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.ok(profile);
  assert.equal(profile.id, orgId);
  assert.equal(profile.name, "Test Org");
  assert.equal(profile.ownerId, userId);
  assert.equal(profile.ownerUnavailable, true);
  assert.deepEqual(profile.state, { kind: "ACTIVE" });
  assert.deepEqual(profile.workspaces, [{ id: workspaceId, name: "Studio", state: "ACTIVE", activeMemberCount: 1 }]);
});

void test("AC-1: owner sees every organization workspace even without workspace membership", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });
  const orgId = generateTestId();
  const ownerId = generateTestId();
  const studioId = generateTestId();
  const opsId = generateTestId();
  fakes.organizationsList.push({ _id: orgId, name: "Acme Design", ownerId, createdAt: fixtureDate, status: "ACTIVE" });
  fakes.workspacesList.push(
    { _id: studioId, orgId, name: "Studio", status: "ACTIVE" },
    { _id: opsId, orgId, name: "Ops", status: "ACTIVE" }
  );
  fakes.membershipsList.push(
    { _id: "m1", workspaceId: studioId, userId: ownerId, status: "ACTIVE" },
    { _id: "m2", workspaceId: studioId, userId: "member-2", status: "ACTIVE" },
    { _id: "m3", workspaceId: opsId, userId: "member-3", status: "ACTIVE" }
  );

  const profile = await repo.findOrganizationProfile({ userId: ownerId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.workspaces, [
    { id: studioId, name: "Studio", state: "ACTIVE", activeMemberCount: 2 },
    { id: opsId, name: "Ops", state: "ACTIVE", activeMemberCount: 1 }
  ]);
});

void test("AC-2: member sees only workspaces where their membership is active", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });
  const orgId = generateTestId();
  const memberId = generateTestId();
  const studioId = generateTestId();
  const opsId = generateTestId();
  fakes.organizationsList.push({ _id: orgId, name: "Acme Design", ownerId: generateTestId(), createdAt: fixtureDate, status: "ACTIVE" });
  fakes.workspacesList.push(
    { _id: studioId, orgId, name: "Studio", status: "ACTIVE" },
    { _id: opsId, orgId, name: "Ops", status: "ACTIVE" }
  );
  fakes.membershipsList.push({ _id: "m1", workspaceId: studioId, userId: memberId, status: "ACTIVE" });

  const profile = await repo.findOrganizationProfile({ userId: memberId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.workspaces, [{ id: studioId, name: "Studio", state: "ACTIVE", activeMemberCount: 1 }]);
  assert.equal(JSON.stringify(profile).includes(opsId), false);
});

void test("AC-4 fault injection: identity lookup failure preserves profile with unavailable owner", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: () => Promise.reject(new Error("identity unavailable"))
  });
  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();
  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: generateTestId(), createdAt: fixtureDate, status: "ACTIVE" });
  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.ok(profile);
  assert.equal(profile.ownerUnavailable, true);
  assert.equal(profile.name, "Test Org");
});

void test("findOrganizationProfile: handles scheduled deletion state", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  const effectiveOn = fixtureDate;
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt: fixtureDate, status: "DELETION_SCHEDULED", deletionScheduledFor: effectiveOn });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.state, { kind: "DELETION_SCHEDULED", effectiveOn });
});

void test("findOrganizationProfile: non-member returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: generateTestId(), createdAt: fixtureDate, status: "ACTIVE" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
  assert.equal(fakes.calls.organizations, 1); // Owner identity is checked before granting access.
});

void test("findOrganizationProfile: unknown organization id returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
});

void test("findOrganizationProfile: malformed id returns null and causes zero reads", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const userId = generateTestId();
  const profile = await repo.findOrganizationProfile({ userId }, "bad-id");

  assert.equal(profile, null);
  assert.equal(fakes.calls.workspaces, 0);
});

void test("findOrganizationProfile: REMOVED membership returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "REMOVED" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
});

void test("findOrganizationProfile: DELETED organization returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt: fixtureDate, status: "DELETED" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
});

void test("findOrganizationProfile: soft-deleted workspace and membership cannot grant access", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"],
    userById: fakes.userById
  });
  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();
  fakes.workspacesList.push({ _id: workspaceId, orgId, name: "Studio", status: "ACTIVE", deletedAt: fixtureDate });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE", deletedAt: fixtureDate });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: generateTestId(), createdAt: fixtureDate, status: "ACTIVE" });
  assert.equal(await repo.findOrganizationProfile({ userId }, orgId), null);
  assert.equal(fakes.calls.organizations, 1);
});
