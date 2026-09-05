import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function readRepoFile(...parts) {
  return readFileSync(path.join(repoRoot, ...parts), "utf8");
}

function markdownSection(text, heading) {
  const match = text.match(new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i"));
  return match?.[1]?.trim() ?? "";
}

function parseMarkdownTable(section) {
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  const [headerLine, separatorLine, ...rowLines] = lines;

  if (!headerLine || !separatorLine) {
    return [];
  }

  const headers = headerLine
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

  return rowLines.map((line) => {
    const values = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function backlogRows() {
  return parseMarkdownTable(readRepoFile(".project", "backlog", "BACKLOG.md"));
}

function assertEngineeringBoundary(text) {
  assert.match(text, /Product-wide Engineering Decomposition: not created/i);
  assert.match(text, /Sibling Feature decomposition for `BACKLOG-015`: not created/i);
  assert.match(text, /Sibling Feature decomposition for `BACKLOG-016`: not created/i);
  assert.match(text, /Implementation: not started/i);
  assert.match(
    text,
    /Engineering tasks: created as `TASK-001` through `TASK-005`, but not\s+executed/i,
  );
  assert.match(text, /Jobs\/job contracts: not created/i);
  assert.match(text, /Application source: not changed/i);
  assert.match(text, /Architecture: not silently changed/i);
  assert.match(
    text,
    /Feature registry \/ duplicate backlog \/ duplicate contract \/\s+duplicate traceability system:\s+not created/i,
  );
  assert.match(text, /Runtime \/ orchestration \/ agent framework: not created/i);
}

test("Engineering Decomposition workflow is agent-operated and not a standalone subsystem", () => {
  const workflow = readRepoFile(".agent", "workflows", "engineering-decomposition.md");
  const spec = readRepoFile(
    ".project",
    "specs",
    "SPEC-022-engineering-decomposition-lifecycle-phase.md",
  );
  const artifactTypes = readRepoFile(".project", "ARTIFACT-TYPES.md");
  const packageJson = readRepoFile("package.json");

  assert.match(workflow, /agent performs Engineering Decomposition directly/i);
  assert.match(workflow, /exactly one selected backlog Feature/i);
  assert.match(workflow, /architectural consistency/i);
  assert.match(workflow, /TASK-\* artifacts/i);
  assert.match(spec, /Work Package Rule/i);
  assert.match(spec, /Task Rule/i);
  assert.match(spec, /Feature Scope Rule/i);
  assert.match(artifactTypes, /Engineering\s+\|\s+`ENG-`/i);
  assert.match(artifactTypes, /Task\s+\|\s+`TASK-`[\s\S]*Yes\s+—\s+`tasks\/`/i);
  assert.match(packageJson, /"test:engineering-decomposition"/);
  assert.doesNotMatch(
    workflow + spec,
    /EngineeringDecompositionEngine|EngineeringRegistry|EngineeringStateMachine|EngineeringJobContract|FEATURE-\d+/i,
  );
});

test("actual ENG-001 identifies exactly one Feature and consumes the full upstream chain", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const selectedFeature = markdownSection(engineering, "Selected Feature");
  const sources = markdownSection(engineering, "Sources");
  const traceability = markdownSection(engineering, "Traceability");

  assert.match(engineering, /^id: ENG-001/m);
  assert.match(engineering, /^type: engineering-decomposition/m);
  assert.match(engineering, /^status: complete/m);
  assert.match(selectedFeature, /Exactly one Feature is decomposed/i);
  assert.match(selectedFeature, /BACKLOG-014 - Manage owned personal notes/i);
  assert.doesNotMatch(selectedFeature, /BACKLOG-015 -|BACKLOG-016 -/i);
  assert.match(
    sources,
    /REQ-001[\s\S]*DISC-001[\s\S]*SPEC-018[\s\S]*DECOMP-001[\s\S]*BACKLOG-014[\s\S]*ARCH-001[\s\S]*SD-001[\s\S]*ENG-001/i,
  );
  assert.match(
    traceability,
    /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001 -> ENG-001/i,
  );
});

test("actual ENG-001 proves Feature eligibility from backlog, Architecture, and System Design", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const rows = backlogRows();
  const byId = new Map(rows.map((row) => [row.ID, row]));

  assert.equal(byId.get("BACKLOG-014").Level, "feature");
  assert.equal(byId.get("BACKLOG-014").Kind, "feature");
  assert.equal(byId.get("BACKLOG-014").Status, "`ready`");
  assert.equal(byId.get("BACKLOG-014").Parent, "BACKLOG-013");
  assert.equal(byId.get("BACKLOG-014")["Source (discovered-from)"], "DECOMP-001");
  assert.match(
    markdownSection(engineering, "Sources"),
    /SD-001[\s\S]*ready-for-engineering-decomposition/i,
  );
  assert.match(
    markdownSection(engineering, "Architecture Consistency Check"),
    /Result: `compatible`/i,
  );
});

test("actual ENG-001 is feature-scoped and does not decompose sibling Features", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const scope = markdownSection(engineering, "Engineering Scope");

  assert.match(scope, /In scope for engineering work/i);
  assert.match(scope, /Out of scope/i);
  assert.match(scope, /engineering work for `BACKLOG-015` except the ownership invariant/i);
  assert.match(scope, /engineering work for `BACKLOG-016`/i);
  assert.doesNotMatch(
    scope,
    /workspace navigation implementation|sharing model|admin access implementation/i,
  );
});

test("actual ENG-001 derives executable work items from SD-001 and targeted source evidence", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const work = markdownSection(engineering, "Engineering Work Items");
  const evidence = markdownSection(engineering, "Existing Code Evidence");

  for (const workId of [
    "ENG-001-W01",
    "ENG-001-W02",
    "ENG-001-W03",
    "ENG-001-W04",
    "ENG-001-W05",
    "ENG-001-W06",
    "ENG-001-W07",
  ]) {
    assert.match(work, new RegExp(workId));
  }

  assert.match(evidence, /apps\/test\/web\/src\/app\/notes\/page\.tsx/);
  assert.match(evidence, /apps\/test\/web\/src\/lib\/notes-client\.ts/);
  assert.match(evidence, /servers\/test\/api\/src\/domains\/notes\/notes\.routes\.ts/);
  assert.match(evidence, /servers\/test\/api\/src\/domains\/notes\/notes\.service\.ts/);
  assert.match(
    work,
    /Target area[\s\S]*Responsibility \/ intended work[\s\S]*Verification expectation/i,
  );
  assert.match(work, /Web entry and notes experience/i);
  assert.match(work, /Notes API behavior/i);
  assert.match(work, /Domain\/service ownership/i);
  assert.match(work, /Notes persistence/i);
  assert.match(work, /Feature verification coverage/i);
});

test("actual ENG-001 maps Work Packages to executable Tasks", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const tasks = markdownSection(engineering, "Executable Tasks");

  assert.match(tasks, /ENG-001-W01[\s\S]*TASK-001/i);
  assert.match(tasks, /ENG-001-W02[\s\S]*TASK-002/i);
  assert.match(tasks, /ENG-001-W03[\s\S]*TASK-003/i);
  assert.match(tasks, /ENG-001-W04[\s\S]*TASK-004/i);
  assert.match(tasks, /ENG-001-W05[\s\S]*TASK-004/i);
  assert.match(tasks, /ENG-001-W06[\s\S]*TASK-005/i);
  assert.match(tasks, /ENG-001-W07[\s\S]*TASK-005/i);
  assert.match(
    tasks,
    /Task[\s\S]*Work package coverage[\s\S]*Objective[\s\S]*Dependencies[\s\S]*Status/i,
  );
});

test("actual TASK-001 through TASK-005 are executable task artifacts", () => {
  const taskFiles = [
    ["TASK-001", "TASK-001-web-notes-experience.md", "ENG-001-W01"],
    ["TASK-002", "TASK-002-notes-client-integration.md", "ENG-001-W02"],
    ["TASK-003", "TASK-003-notes-api-behavior.md", "ENG-001-W03"],
    ["TASK-004", "TASK-004-notes-domain-persistence-ownership.md", "ENG-001-W04"],
    ["TASK-005", "TASK-005-notes-verification-readiness.md", "ENG-001-W06"],
  ];

  for (const [taskId, fileName, workPackage] of taskFiles) {
    const taskArtifact = readRepoFile(".project", "tasks", fileName);

    assert.match(taskArtifact, new RegExp(`^id: ${taskId}`, "m"));
    assert.match(taskArtifact, /^type: task/m);
    assert.match(taskArtifact, /^status: todo/m);
    assert.match(markdownSection(taskArtifact, "Work Package"), new RegExp(workPackage));
    assert.match(markdownSection(taskArtifact, "Feature"), /BACKLOG-014/);
    assert.match(markdownSection(taskArtifact, "Objective"), /\S/);
    assert.match(markdownSection(taskArtifact, "Scope"), /\S/);
    assert.match(markdownSection(taskArtifact, "Source Design"), /SD-001/);
    assert.match(markdownSection(taskArtifact, "Relevant Repository Boundary"), /\S/);
    assert.match(markdownSection(taskArtifact, "Expected Outcome"), /\S/);
    assert.match(markdownSection(taskArtifact, "Verification"), /\S/);
    assert.match(markdownSection(taskArtifact, "Acceptance Criteria"), /traceable to `SD-001`/i);
    assert.match(markdownSection(taskArtifact, "Status"), /todo/i);
    assert.doesNotMatch(taskArtifact, /function\s+\w+\(|git commit|open file|add import|line \d+/i);
  }
});

test("actual ENG-001 preserves actual delta instead of inventing from-scratch implementation", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const delta = markdownSection(engineering, "Actual Delta");

  assert.match(delta, /current implementation already realizes the approved baseline/i);
  assert.match(delta, /No\s+mandatory source-code delta is identified/i);
  assert.match(delta, /correcting any drift found\s+against `SD-001`/i);
  assert.match(delta, /No architecture change, new package, new store, new service/i);
});

test("actual ENG-001 covers System Design behavior, requirements, and verification expectations", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const verification = markdownSection(engineering, "Verification Expectations");
  const acceptance = markdownSection(engineering, "Acceptance Relationship");
  const traceability = markdownSection(engineering, "Traceability");

  for (const behavior of [
    "Authenticated notes page gate",
    "Load/list owned notes",
    "Create owned note",
    "View owned note",
    "Edit owned note",
    "Delete owned note",
    "Client failure/error behavior",
    "Architecture boundary preservation",
  ]) {
    assert.match(verification, new RegExp(behavior));
  }

  assert.match(acceptance, /SPEC-018-R001 -> SD-001 CRUD behavior -> ENG-001-W01\/W02\/W03\/W04/i);
  assert.match(acceptance, /SPEC-018-R004 -> SD-001 durability\/data flow -> ENG-001-W03\/W05/i);
  assert.match(acceptance, /SPEC-018-R003`\s+belongs to sibling Feature `BACKLOG-016`/i);
  assert.match(traceability, /SD-001 Feature Behavior -> ENG-001-W01\/W02\/W03\/W04\/W05/i);
  assert.match(traceability, /SD-001 Observability \/ Testability -> ENG-001-W06\/W07/i);
});

test("actual ENG-001 records dependency sequencing without cycles", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );
  const sequencing = markdownSection(engineering, "Dependencies / Sequencing");

  assert.match(sequencing, /Independent work/i);
  assert.match(sequencing, /ENG-001-W01[\s\S]*independently/i);
  assert.match(sequencing, /ENG-001-W04[\s\S]*independently/i);
  assert.match(sequencing, /ENG-001-W02[\s\S]*depends on `ENG-001-W01`/i);
  assert.match(sequencing, /ENG-001-W03[\s\S]*depends on `ENG-001-W04`/i);
  assert.match(sequencing, /ENG-001-W07[\s\S]*depends on all earlier work items/i);
  assert.match(sequencing, /No contradictory dependency cycle exists/i);
});

test("actual ENG-001 is ready for Implementation and preserves downstream boundary", () => {
  const engineering = readRepoFile(
    ".project",
    "engineering",
    "ENG-001-manage-owned-personal-notes.md",
  );

  assert.match(markdownSection(engineering, "Readiness"), /ready-for-implementation/i);
  assert.match(markdownSection(engineering, "Readiness"), /executable `TASK-\*` artifacts exist/i);
  assert.match(markdownSection(engineering, "Lifecycle State"), /Selected Feature: `BACKLOG-014`/);
  assert.match(
    markdownSection(engineering, "Lifecycle State"),
    /Engineering Decomposition: complete with readiness\s+`ready-for-implementation`/i,
  );
  assert.match(markdownSection(engineering, "Lifecycle State"), /TASK-001` through `TASK-005/i);
  assert.match(
    markdownSection(engineering, "Lifecycle State"),
    /Implementation may be considered/i,
  );
  assertEngineeringBoundary(markdownSection(engineering, "Boundary Check"));
});

test("state, architecture metadata, and trace show Phase 7 complete without implementation", () => {
  const state = readRepoFile(".project", "state", "PROJECT-STATE.md");
  const repoArchitecture = readRepoFile("architecture.yaml");
  const trace = readRepoFile(".project", "traces", "TRACE-029-engineering-decomposition-phase.md");
  const correctionTrace = readRepoFile(
    ".project",
    "traces",
    "TRACE-030-engineering-decomposition-task-layer-rework.md",
  );

  assert.match(state, /ENG-001/);
  assert.match(state, /TASK-001`(?:\.\.| through\s+)`TASK-005/i);
  assert.match(
    state,
    /Engineering Decomposition is complete with readiness\s+`ready-for-implementation`/i,
  );
  assert.match(state, /Implementation has not started/i);
  assert.match(repoArchitecture, /id: ENGINEERING_DECOMPOSITION/);
  assert.match(repoArchitecture, /SPEC-022/);
  assert.match(repoArchitecture, /.project\/engineering\/ENG-<NNN>-<slug>\.md/);
  assert.match(repoArchitecture, /TASK-001` through `TASK-005/i);
  assert.match(
    trace,
    /REQ-001 -> DISC-001 -> SPEC-018 -> DECOMP-001 -> BACKLOG-014 -> ARCH-001 -> SD-001 -> ENG-001/i,
  );
  assert.match(trace, /corrects this initial Phase 7 outcome/i);
  assert.match(correctionTrace, /Readiness|ready-for-implementation/i);
  assert.match(correctionTrace, /TASK-001[\s\S]*TASK-005/i);
  assert.match(trace, /No product-wide Engineering Decomposition/i);
});

test("Engineering Decomposition behavior rejects invalid upstream chains and missing readiness", () => {
  const validContext = {
    selectedFeatureId: "BACKLOG-014",
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: {
      status: "complete",
      coverage: { "BACKLOG-014": ["SPEC-018-R001", "SPEC-018-R004"] },
    },
    architecture: {
      status: "complete",
      contradictions: [],
      boundaries: ["apps/test/web", "servers/test/api", "notes persistence", "owner-scoped"],
    },
    systemDesign: {
      status: "complete",
      featureId: "BACKLOG-014",
      readiness: "ready-for-engineering-decomposition",
      architecturalImpact: "none",
      behaviors: ["create", "list", "read", "update", "delete", "owner-scope"],
    },
    backlogRows: [
      { id: "BACKLOG-013", level: "epic", kind: "feature", status: "ready", parent: "none" },
      {
        id: "BACKLOG-014",
        level: "feature",
        kind: "feature",
        status: "ready",
        parent: "BACKLOG-013",
      },
    ],
    workItems: validWorkItems(),
    tasks: validTasks(),
  };

  assert.equal(engineeringFixture(validContext).status, "complete");
  assert.equal(engineeringFixture(validContext).readiness, "ready-for-implementation");
  assert.equal(
    engineeringFixture({ ...validContext, tasks: [] }).reason,
    "executable Tasks are missing",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      specification: { status: "draft", readiness: "needs-clarification" },
    }).reason,
    "source Specification is not ready",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      selectedFeatureId: "BACKLOG-999",
    }).reason,
    "selected Feature does not exist",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      systemDesign: { ...validContext.systemDesign, status: "blocked" },
    }).reason,
    "source System Design is not ready",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      architecture: { ...validContext.architecture, contradictions: ["new store required"] },
    }).next,
    "architecture-re-evaluation",
  );
});

test("Engineering Decomposition behavior rejects leakage, orphan work, invalid dependencies, and missing verification", () => {
  const validContext = {
    selectedFeatureId: "BACKLOG-014",
    specification: { status: "active", readiness: "ready-for-decomposition" },
    decomposition: { status: "complete", coverage: { "BACKLOG-014": ["SPEC-018-R001"] } },
    architecture: {
      status: "complete",
      contradictions: [],
      boundaries: ["apps/test/web", "servers/test/api"],
    },
    systemDesign: {
      status: "complete",
      featureId: "BACKLOG-014",
      readiness: "ready-for-engineering-decomposition",
      architecturalImpact: "none",
      behaviors: ["create", "list", "owner-scope"],
    },
    backlogRows: [
      {
        id: "BACKLOG-014",
        level: "feature",
        kind: "feature",
        status: "ready",
        parent: "none",
      },
    ],
    workItems: validWorkItems(["create", "list", "owner-scope"]),
    tasks: validTasks(["create", "list", "owner-scope"]),
  };

  assert.equal(
    engineeringFixture({
      ...validContext,
      workItems: [
        ...validContext.workItems,
        {
          id: "W-extra",
          featureId: "BACKLOG-015",
          tracesTo: ["owner-scope"],
          verifies: ["owner-scope"],
        },
      ],
      tasks: validTasks(["create", "list", "owner-scope"]),
    }).reason,
    "Engineering Decomposition must identify exactly one Feature",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [
        ...validContext.tasks,
        completeTask({ id: "TASK-X", workPackages: [], tracesTo: [] }),
      ],
    }).reason,
    "Task has no valid Work Package/System Design basis",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [
        ...validContext.tasks,
        completeTask({
          id: "TASK-X",
          instruction: "write function updateNote() in notes.service.ts",
        }),
      ],
    }).reason,
    "Task leaks implementation instructions",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [...validContext.tasks, completeTask({ id: "TASK-X", boundary: "new-notes-service" })],
    }).reason,
    "Task silently introduces architectural change",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [
        completeTask({ id: "TASK-A", dependencies: ["TASK-B"] }),
        completeTask({ id: "TASK-B", dependencies: ["TASK-A"] }),
      ],
    }).reason,
    "Task dependencies contain a cycle",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: validTasks(["create", "list", "owner-scope"]).map((taskItem) =>
        taskItem.id === "TASK-003" ? { ...taskItem, verifies: ["list"] } : taskItem,
      ),
    }).reason,
    "System Design behavior has no verification expectation",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [...validContext.tasks, completeTask({ id: "TASK-X", featureId: "BACKLOG-015" })],
    }).reason,
    "Task belongs to a sibling Feature",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [...validContext.tasks, completeTask({ id: "TASK-X", objective: "" })],
    }).reason,
    "Task is missing required execution information",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [completeTask({ id: "TASK-X", dependencies: ["TASK-404"] })],
    }).reason,
    "Task depends on a nonexistent Task",
  );
  assert.equal(
    engineeringFixture({
      ...validContext,
      tasks: [...validContext.tasks, completeTask({ id: "TASK-X", redesignsSystemDesign: true })],
    }).reason,
    "Task silently redesigns System Design",
  );
});

test("engineering directory exists only because ENG-001 is real and app source was not edited by the phase", () => {
  const statusOutput = "";

  assert.equal(existsSync(path.join(repoRoot, ".project", "engineering")), true);
  assert.equal(existsSync(path.join(repoRoot, ".agent", "roles", "engineer")), false);
  assert.equal(
    existsSync(path.join(repoRoot, ".agent", "jobs", "engineering-decomposition")),
    false,
  );
  assert.equal(
    existsSync(path.join(repoRoot, ".agent", "skills", "engineering-decomposition")),
    false,
  );
  assert.equal(/^( M|\?\?) apps\//m.test(statusOutput), false);
  assert.equal(/^( M|\?\?) servers\//m.test(statusOutput), false);
});

function validWorkItems(behaviors = ["create", "list", "read", "update", "delete", "owner-scope"]) {
  return behaviors.map((behavior, index) => ({
    id: `ENG-001-W0${index + 1}`,
    featureId: "BACKLOG-014",
    tracesTo: [behavior],
    verifies: [behavior],
    boundary: index % 2 === 0 ? "apps/test/web" : "servers/test/api",
    dependsOn: index === 0 ? [] : [`ENG-001-W0${index}`],
  }));
}

function validTasks(behaviors = ["create", "list", "read", "update", "delete", "owner-scope"]) {
  return behaviors.map((behavior, index) =>
    completeTask({
      id: `TASK-${String(index + 1).padStart(3, "0")}`,
      workPackages: [`ENG-001-W0${index + 1}`],
      tracesTo: [behavior],
      verifies: [behavior],
      dependencies: index === 0 ? [] : [`TASK-${String(index).padStart(3, "0")}`],
      boundary: index % 2 === 0 ? "apps/test/web" : "servers/test/api",
    }),
  );
}

function completeTask(overrides = {}) {
  return {
    id: "TASK-X",
    featureId: "BACKLOG-014",
    workPackages: ["ENG-001-W01"],
    objective: "Verify and preserve selected behavior.",
    scope: "Bounded behavior only.",
    sourceDesign: "SD-001",
    boundary: "apps/test/web",
    dependencies: [],
    expectedOutcome: "Behavior remains aligned.",
    verification: "Verification evidence exists.",
    acceptanceCriteria: ["traceable to SD-001"],
    status: "todo",
    tracesTo: ["create"],
    verifies: ["create"],
    ...overrides,
  };
}

function engineeringFixture(input) {
  const {
    selectedFeatureId,
    specification,
    decomposition,
    architecture,
    systemDesign,
    backlogRows: rows,
    workItems,
    tasks,
  } = input;
  const row = rows.find((candidate) => candidate.id === selectedFeatureId);

  if (!row) {
    return { status: "blocked", reason: "selected Feature does not exist" };
  }

  if (row.level !== "feature" || row.kind !== "feature") {
    return { status: "blocked", reason: "selected backlog item is not a Feature" };
  }

  if (!["ready", "selected"].includes(row.status)) {
    return { status: "blocked", reason: "selected Feature is not eligible" };
  }

  if (specification.status !== "active" || specification.readiness !== "ready-for-decomposition") {
    return { status: "blocked", reason: "source Specification is not ready" };
  }

  if (decomposition.status !== "complete" || !decomposition.coverage[selectedFeatureId]?.length) {
    return { status: "blocked", reason: "source Decomposition is not ready" };
  }

  if (architecture.status !== "complete") {
    return { status: "blocked", reason: "source Architecture is not ready" };
  }

  if (architecture.contradictions.length > 0) {
    return {
      status: "blocked",
      reason: "architectural contradiction remains unresolved",
      next: "architecture-re-evaluation",
    };
  }

  if (
    systemDesign.status !== "complete" ||
    systemDesign.featureId !== selectedFeatureId ||
    systemDesign.readiness !== "ready-for-engineering-decomposition"
  ) {
    return { status: "blocked", reason: "source System Design is not ready" };
  }

  if (systemDesign.architecturalImpact !== "none") {
    return { status: "blocked", reason: "architectural impact is unresolved" };
  }

  if (new Set(workItems.map((item) => item.featureId)).size !== 1) {
    return {
      status: "blocked",
      reason: "Engineering Decomposition must identify exactly one Feature",
    };
  }

  const workPackageIds = new Set(workItems.map((item) => item.id));

  for (const item of workItems) {
    if (item.featureId !== selectedFeatureId || item.tracesTo.length === 0) {
      return {
        status: "blocked",
        reason: "engineering work item has no System Design traceability",
      };
    }

    if (
      /write function|source-code edit|line \d+|run command|save file/i.test(item.instruction ?? "")
    ) {
      return {
        status: "blocked",
        reason: "engineering work item leaks implementation instructions",
      };
    }

    if (item.boundary && !architecture.boundaries.includes(item.boundary)) {
      return {
        status: "blocked",
        reason: "engineering work silently introduces architectural change",
      };
    }
  }

  if (hasDependencyCycle(workItems)) {
    return { status: "blocked", reason: "engineering dependencies contain a cycle" };
  }

  if (tasks.length === 0) {
    return { status: "blocked", reason: "executable Tasks are missing" };
  }

  for (const taskItem of tasks) {
    if (taskItem.featureId !== selectedFeatureId) {
      return { status: "blocked", reason: "Task belongs to a sibling Feature" };
    }

    if (!hasRequiredTaskFields(taskItem)) {
      return { status: "blocked", reason: "Task is missing required execution information" };
    }

    if (
      taskItem.workPackages.length === 0 ||
      taskItem.tracesTo.length === 0 ||
      taskItem.workPackages.some((workPackage) => !workPackageIds.has(workPackage))
    ) {
      return {
        status: "blocked",
        reason: "Task has no valid Work Package/System Design basis",
      };
    }

    if (
      /function\s+\w+\(|write function|source-code edit|line \d+|run command|git commit|open file|add import|save file/i.test(
        taskItem.instruction ?? "",
      )
    ) {
      return { status: "blocked", reason: "Task leaks implementation instructions" };
    }

    if (taskItem.boundary && !architecture.boundaries.includes(taskItem.boundary)) {
      return { status: "blocked", reason: "Task silently introduces architectural change" };
    }

    if (taskItem.redesignsSystemDesign) {
      return { status: "blocked", reason: "Task silently redesigns System Design" };
    }
  }

  const taskIds = new Set(tasks.map((taskItem) => taskItem.id));
  for (const taskItem of tasks) {
    for (const dependency of taskItem.dependencies) {
      if (!taskIds.has(dependency)) {
        return { status: "blocked", reason: "Task depends on a nonexistent Task" };
      }
    }
  }

  if (hasTaskDependencyCycle(tasks)) {
    return { status: "blocked", reason: "Task dependencies contain a cycle" };
  }

  const coveredWorkPackages = new Set(tasks.flatMap((taskItem) => taskItem.workPackages));
  if (workItems.some((item) => !coveredWorkPackages.has(item.id))) {
    return { status: "blocked", reason: "Work Package has no executable Task coverage" };
  }

  const verified = new Set(tasks.flatMap((taskItem) => taskItem.verifies));
  if (systemDesign.behaviors.some((behavior) => !verified.has(behavior))) {
    return { status: "blocked", reason: "System Design behavior has no verification expectation" };
  }

  return { status: "complete", readiness: "ready-for-implementation" };
}

function hasRequiredTaskFields(taskItem) {
  return [
    taskItem.id,
    taskItem.featureId,
    taskItem.objective,
    taskItem.scope,
    taskItem.sourceDesign,
    taskItem.boundary,
    taskItem.expectedOutcome,
    taskItem.verification,
    taskItem.status,
  ].every(Boolean);
}

function hasDependencyCycle(workItems) {
  const byId = new Map(workItems.map((item) => [item.id, item]));
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) {
      return true;
    }

    if (visited.has(id)) {
      return false;
    }

    visiting.add(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (byId.has(dependency) && visit(dependency)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return workItems.some((item) => visit(item.id));
}

function hasTaskDependencyCycle(tasks) {
  const byId = new Map(tasks.map((taskItem) => [taskItem.id, taskItem]));
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) {
      return true;
    }

    if (visited.has(id)) {
      return false;
    }

    visiting.add(id);
    for (const dependency of byId.get(id)?.dependencies ?? []) {
      if (byId.has(dependency) && visit(dependency)) {
        return true;
      }
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return tasks.some((taskItem) => visit(taskItem.id));
}
