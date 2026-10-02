import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceRepository, type WorkspaceRepositoryDependencies } from "../workspace.repository.js";

const generateTestId = () => Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');

const createFakes = () => {
  const workspacesList: Record<string, unknown>[] = [];
  const membershipsList: Record<string, unknown>[] = [];
  const organizationsList: Record<string, unknown>[] = [];

  let findWorkspacesCalls = 0;
  let findMembershipsCalls = 0;
  let findOrganizationsCalls = 0;

  const workspaces = {
    find: (filter: Record<string, unknown>) => {
      findWorkspacesCalls++;
      return Promise.resolve(workspacesList.filter(w => {
        if (filter.orgId && filter.orgId !== w.orgId) return false;
        if (filter.status && typeof filter.status === "object" && "$ne" in filter.status && w.status === (filter.status as Record<string, unknown>).$ne) return false;
        return true;
      }));
    },
    findOne: () => Promise.resolve(null)
  };

  const memberships = {
    find: () => Promise.resolve([]),
    findOne: (filter: Record<string, unknown>) => {
      findMembershipsCalls++;
      return Promise.resolve(membershipsList.find(m => {
        if (filter.userId && filter.userId !== m.userId) return false;
        if (filter.status && filter.status !== m.status) return false;
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
        if (filter.status && typeof filter.status === "object" && "$ne" in filter.status && o.status === (filter.status as Record<string, unknown>).$ne) return false;
        return true;
      }) || null);
    }
  };

  return {
    workspaces,
    memberships,
    organizations,
    workspacesList,
    membershipsList,
    organizationsList,
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
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  const createdAt = new Date();
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt, status: "ACTIVE" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.ok(profile);
  assert.equal(profile.id, orgId);
  assert.equal(profile.name, "Test Org");
  assert.equal(profile.ownerId, userId);
  assert.deepEqual(profile.state, { kind: "ACTIVE" });
});

void test("findOrganizationProfile: handles scheduled deletion state", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  const effectiveOn = new Date();
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt: new Date(), status: "DELETION_SCHEDULED", deletionScheduledFor: effectiveOn });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.ok(profile);
  assert.deepEqual(profile.state, { kind: "DELETION_SCHEDULED", effectiveOn });
});

void test("findOrganizationProfile: non-member returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, status: "ACTIVE" });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt: new Date(), status: "ACTIVE" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
  assert.equal(fakes.calls.organizations, 0); // Non-member causes ZERO organization reads
});

void test("findOrganizationProfile: unknown organization id returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
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
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
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
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "REMOVED" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
});

void test("findOrganizationProfile: DELETED organization returns null", async () => {
  const fakes = createFakes();
  const repo = createWorkspaceRepository({
    workspaces: fakes.workspaces as unknown as WorkspaceRepositoryDependencies["workspaces"],
    memberships: fakes.memberships as unknown as WorkspaceRepositoryDependencies["memberships"],
    organizations: fakes.organizations as unknown as WorkspaceRepositoryDependencies["organizations"]
  });

  const orgId = generateTestId();
  const userId = generateTestId();
  const workspaceId = generateTestId();

  fakes.workspacesList.push({ _id: workspaceId, orgId, status: "ACTIVE" });
  fakes.membershipsList.push({ _id: "m1", workspaceId, userId, status: "ACTIVE" });
  fakes.organizationsList.push({ _id: orgId, name: "Test Org", ownerId: userId, createdAt: new Date(), status: "DELETED" });

  const profile = await repo.findOrganizationProfile({ userId }, orgId);
  assert.equal(profile, null);
});
