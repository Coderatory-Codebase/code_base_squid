import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOrganizationProfile,
  type OrganizationProfileInput,
  type OrganizationWorkspaceProfile,
  type Result
} from "../domain/organization-profile.js";

const valueFrom = <Value, Error>(result: Result<Value, Error>): Value => {
  if (result.ok) return result.value;
  assert.fail(`Expected success; received ${JSON.stringify(result.error)}`);
};

const workspace = (id: string, state: OrganizationWorkspaceProfile["state"], activeMemberCount: number): OrganizationWorkspaceProfile => ({
  id,
  name: id,
  state,
  activeMemberCount
});

const createInput = (overrides: Partial<OrganizationProfileInput> = {}): OrganizationProfileInput => ({
  principal: { userId: "owner-1" },
  organization: {
    id: "org-1",
    name: "Acme Design",
    ownerId: "owner-1",
    createdAt: new Date("2026-10-01T12:00:00.000Z"),
    state: { kind: "ACTIVE" }
  },
  workspaces: [workspace("studio", "ACTIVE", 12), workspace("ops", "ACTIVE", 4)],
  activeMemberWorkspaceIds: ["studio"],
  ...overrides
});

void test("AC-1: an organization owner receives all workspaces, including those without membership", () => {
  const result = valueFrom(buildOrganizationProfile(createInput()));
  assert.deepEqual(result.workspaces, [workspace("studio", "ACTIVE", 12), workspace("ops", "ACTIVE", 4)]);
});

void test("AC-2: a non-owner receives only their member workspaces and no fields from other workspaces", () => {
  const result = valueFrom(buildOrganizationProfile(createInput({
    principal: { userId: "member-1" },
    workspaces: [
      workspace("studio", "ACTIVE", 12),
      { ...workspace("ops", "ACTIVE", 4), privateLabel: "private ops data" } as OrganizationWorkspaceProfile
    ],
    activeMemberWorkspaceIds: ["studio"]
  })));
  assert.deepEqual(result.workspaces, [workspace("studio", "ACTIVE", 12)]);
  assert.equal(JSON.stringify(result).includes("private ops data"), false);
});

void test("AC-3: archived workspace state and active-member counts are preserved", () => {
  const result = valueFrom(buildOrganizationProfile(createInput({
    workspaces: [workspace("old-site", "ARCHIVED", 0), workspace("studio", "ACTIVE", 10)]
  })));
  assert.deepEqual(result.workspaces, [workspace("old-site", "ARCHIVED", 0), workspace("studio", "ACTIVE", 10)]);
});

void test("X-data: the profile is refused when the principal is neither owner nor member", () => {
  const result = buildOrganizationProfile(createInput({
    principal: { userId: "unrelated-user" },
    activeMemberWorkspaceIds: []
  }));

  assert.deepEqual(result, { ok: false, error: { kind: "forbidden" } });
});

void test("invalid or missing profile inputs return errors rather than throwing", () => {
  assert.deepEqual(
    buildOrganizationProfile(createInput({ principal: { userId: " " } })),
    { ok: false, error: { kind: "invalid-principal" } }
  );
  assert.deepEqual(
    buildOrganizationProfile(createInput({ organization: null })),
    { ok: false, error: { kind: "organization-not-found" } }
  );
});

void test("AC-4 data shape: all 100 workspaces remain visible across 200 profile builds", () => {
  const workspaces = Array.from({ length: 100 }, (_, index) => workspace(`workspace-${String(index)}`, "ACTIVE", index));
  const input = createInput({ workspaces, activeMemberWorkspaceIds: [] });

  for (let run = 0; run < 200; run += 1) {
    const result = valueFrom(buildOrganizationProfile(input));
    assert.equal(result.workspaces.length, 100);
  }
});

void test("AC-4 domain budget: 200 builds for 100 workspaces stay below the 700 ms p95 budget", () => {
  const workspaces = Array.from({ length: 100 }, (_, index) => workspace(`workspace-${String(index)}`, "ACTIVE", index));
  const input = createInput({ workspaces, activeMemberWorkspaceIds: [] });
  const durations: number[] = [];

  for (let openNumber = 0; openNumber < 200; openNumber += 1) {
    const startedAt = performance.now();
    const result = valueFrom(buildOrganizationProfile(input));
    durations.push(performance.now() - startedAt);
    assert.equal(result.workspaces.length, 100);
  }

  durations.sort((left, right) => left - right);
  const p95Milliseconds = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95Milliseconds !== undefined);
  console.info(`organization-profile domain budget: p95=${p95Milliseconds.toFixed(3)}ms; builds=200; workspaces=100`);
  assert.ok(p95Milliseconds < 700, `expected domain p95 below 700 ms, received ${p95Milliseconds.toFixed(3)} ms`);
});
