import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EVENT_CONTRACT_SCHEMAS,
  findEventSchemaCompatibilityIssues,
  formatEventSchemaCompatibilityIssue,
  type EventSchemaSnapshot
} from "../src/index.js";

const snapshotPath = path.resolve("contracts/event-schemas.snapshot.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
};

const parseSnapshot = (contents: string): EventSchemaSnapshot => {
  const parsed: unknown = JSON.parse(contents);
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Number.isInteger(parsed.release) || !isRecord(parsed.events)) {
    throw new Error("Event schema snapshot must contain schemaVersion 1, a positive release number, and an events object.");
  }
  if (typeof parsed.release !== "number" || parsed.release < 1) {
    throw new Error("Event schema snapshot release must be a positive integer.");
  }
  return parsed as unknown as EventSchemaSnapshot;
};

const readOption = (args: readonly string[], name: string): string | undefined => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};

const writeSnapshot = async (releaseInput: string | undefined): Promise<void> => {
  const release = Number(releaseInput);
  if (!Number.isInteger(release) || release < 1) {
    throw new Error("Pass an explicit positive --release number when writing a published schema snapshot.");
  }
  const snapshot: EventSchemaSnapshot = {
    schemaVersion: 1,
    release,
    events: EVENT_CONTRACT_SCHEMAS
  };
  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  process.stdout.write(`Wrote event schema snapshot for release ${String(release)}.\n`);
};

const checkCompatibility = async (baselinePath: string): Promise<number> => {
  const baseline = parseSnapshot(await readFile(baselinePath, "utf8"));
  const checkedInSnapshot = parseSnapshot(await readFile(snapshotPath, "utf8"));
  if (stableJson(checkedInSnapshot.events) !== stableJson(EVENT_CONTRACT_SCHEMAS)) {
    throw new Error("The checked-in event schema snapshot is out of date. Update it with the schemas being published.");
  }
  const current: EventSchemaSnapshot = {
    schemaVersion: 1,
    release: baseline.release,
    events: EVENT_CONTRACT_SCHEMAS
  };
  const issues = findEventSchemaCompatibilityIssues(baseline, current);

  if (issues.length > 0) {
    for (const issue of issues) {
      process.stderr.write(`${formatEventSchemaCompatibilityIssue(issue)}\n`);
    }
    return 1;
  }

  process.stdout.write(`Event contracts are compatible with release ${String(baseline.release)}.\n`);
  return 0;
};

const main = async (): Promise<number> => {
  const args = process.argv.slice(2);
  if (args.includes("--write-snapshot")) {
    await writeSnapshot(readOption(args, "--release"));
    return 0;
  }

  const baselineInput = readOption(args, "--baseline");
  return checkCompatibility(path.resolve(baselineInput ?? snapshotPath));
};

void main().then((exitCode) => {
  process.exitCode = exitCode;
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Event compatibility check failed: ${message}\n`);
  process.exitCode = 1;
});
