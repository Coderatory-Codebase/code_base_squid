#!/usr/bin/env node
import { inspect } from "node:util";
import { discoverWorkspace } from "../workspace/discovery.mjs";
import { createDependencyGraph, topologicalProjectOrder } from "../graph/dependency-graph.mjs";
import { createExecutionPlan, listTasks } from "../execution/tasks.mjs";
import { executePlan } from "../execution/runner.mjs";
import { runWorkspaceChecks } from "../checks/workspace-checks.mjs";
import { runWorkspaceScans } from "../checks/scans.mjs";
import { generateProject } from "../generators/project-generator.mjs";

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const print = (value) => process.stdout.write(typeof value === "string" ? value : `${inspect(value, { depth: null })}\n`);
const hasFlag = (args, name) => args.includes(`--${name}`);

const printIssues = (issues, { json }) => {
  if (json) return print(formatJson({ ok: !issues.some((issue) => issue.level === "error"), issues }));
  if (issues.length === 0) return print("No issues found.\n");
  for (const issue of issues) print(`${issue.level.toUpperCase()}: ${issue.message}\n`);
};

const getOption = (args, name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const requireOption = (args, name) => {
  const value = getOption(args, name);
  if (!value) throw new Error(`Missing required option --${name}`);
  return value;
};

const createPlan = (workspace, taskName) => {
  if (!taskName) throw new Error("Missing task name.");
  const graph = createDependencyGraph(workspace.projects);
  const tasks = listTasks(workspace.projects);
  return createExecutionPlan({ graph, projects: workspace.projects, tasks, taskName });
};

const setIssueExitCode = (issues) => {
  process.exitCode = issues.some((issue) => issue.level === "error") ? 1 : 0;
};

const commands = {
  help: async () => print(`repo commands

  projects                         List discovered projects
  graph                            Print the internal dependency graph
  tasks                            List project tasks
  plan <task>                      Print a dependency-ordered task plan
  run <task> [--dry-run] [--json] Execute a task plan
  check [--json]                   Run correctness and architecture checks
  scan [--json]                    Run risk/security scans
  validate [--json]                Run checks and scans
  generate project --type <type> --name <name>

`),

  projects: async ({ workspace }) => print(formatJson(workspace.projects)),
  graph: async ({ workspace }) => {
    const graph = createDependencyGraph(workspace.projects);
    const order = topologicalProjectOrder(graph);
    print(formatJson({ ...graph, order: order.ordered, cycles: order.cycles }));
  },
  tasks: async ({ workspace }) => print(formatJson(listTasks(workspace.projects))),
  plan: async ({ workspace, args }) => print(formatJson(createPlan(workspace, args[0]))),
  run: async ({ workspace, args }) => {
    const json = hasFlag(args, "json");
    const results = await executePlan({
      workspace,
      plan: createPlan(workspace, args[0]),
      dryRun: hasFlag(args, "dry-run"),
      captureOutput: json
    });
    if (json) print(formatJson(results));
    else for (const result of results) print(`${result.status.toUpperCase()}: ${result.task}\n`);
    process.exitCode = results.some((result) => result.status === "failed") ? 1 : 0;
  },
  check: async ({ workspace, args }) => {
    const issues = await runWorkspaceChecks(workspace);
    printIssues(issues, { json: hasFlag(args, "json") });
    setIssueExitCode(issues);
  },
  scan: async ({ workspace, args }) => {
    const issues = await runWorkspaceScans(workspace);
    printIssues(issues, { json: hasFlag(args, "json") });
    setIssueExitCode(issues);
  },
  validate: async ({ workspace, args }) => {
    const issues = [...await runWorkspaceChecks(workspace), ...await runWorkspaceScans(workspace)];
    printIssues(issues, { json: hasFlag(args, "json") });
    setIssueExitCode(issues);
  },
  generate: async ({ workspace, args }) => {
    if (args[0] !== "project") throw new Error(`Unsupported generator target: ${args[0] ?? "(missing)"}`);
    const generated = await generateProject({
      workspaceRoot: workspace.root,
      architecture: workspace.architecture,
      type: requireOption(args, "type"),
      name: requireOption(args, "name")
    });
    print(formatJson(generated.manifest));
  }
};

const main = async () => {
  const [commandName = "help", ...args] = process.argv.slice(2);
  const command = commands[commandName];
  if (!command) throw new Error(`Unknown command: ${commandName}`);
  const workspace = await discoverWorkspace();
  await command({ workspace, args });
};

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
