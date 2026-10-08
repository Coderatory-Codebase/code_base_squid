import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { systemClock } from "@workspace/kernel";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp, createServer } from "../bootstrap/index.js";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import type { Principal } from "../types/index.js";
import {
  explainOrganizationSettingsQueryFor,
  OrganizationModel
} from "../features/workspace/index.js";

const requests = 200;
const targetVolume = 200;
const budgetMs = 700;
const workspaceId = "organization-settings-load-test-workspace";
const principal: Principal = { userId: "organization-settings-load-test-owner", workspaceIds: [workspaceId] };
const logger = {
  info: (_message: string, _context?: Record<string, unknown>): void => undefined,
  warn: (_message: string, _context?: Record<string, unknown>): void => undefined,
  error: (_message: string, _context?: Record<string, unknown>): void => undefined
};

const collectUsedIndexes = (value: unknown, indexes: Set<string> = new Set()): Set<string> => {
  if (Array.isArray(value)) {
    for (const item of value) collectUsedIndexes(item, indexes);
    return indexes;
  }
  if (typeof value !== "object" || value === null) return indexes;
  const node = value as Record<string, unknown>;
  if (node.stage === "IXSCAN" && typeof node.indexName === "string") indexes.add(node.indexName);
  for (const child of Object.values(node)) collectUsedIndexes(child, indexes);
  return indexes;
};

const percentile = (durations: readonly number[], fraction: number): number =>
  Number((durations[Math.ceil(durations.length * fraction) - 1] ?? 0).toFixed(2));

const measureOrganizationSettingsBudget = async (): Promise<void> => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const database = createMongoDbIntegration({ uri: mongo.getUri(), logger });
  const config = {
    environment: "test" as const,
    host: "127.0.0.1",
    port: 0,
    webOrigin: "http://localhost:3000",
    logLevel: "silent" as const
  };
  const server = createServer({
    app: createApp({ config, logger, resolvePrincipal: () => principal }),
    config,
    logger
  });

  try {
    await database.connect();
    await OrganizationModel.init();
    const now = new Date(systemClock.now());
    await OrganizationModel.insertMany(Array.from({ length: targetVolume }, (_, index) => ({
      _id: String(index + 1).padStart(24, "0"),
      name: `Organization settings budget ${String(index + 1).padStart(3, "0")}`,
      ownerId: principal.userId,
      workspaceIds: [workspaceId],
      lastUsedAt: now,
      deletedAt: null,
      settings: {
        timeZone: "Europe/London",
        weekStart: "Monday",
        dateFormat: "DD/MM/YYYY",
        workspaceSetupRule: "any member"
      }
    })));

    const explanation = await explainOrganizationSettingsQueryFor(principal);
    const indexesUsed = [...collectUsedIndexes(explanation.queryPlanner?.winningPlan)].sort();
    const expectedIndex = "workspace_settings_live_cover";
    await server.start();
    const address = server.raw.address();
    if (!address || typeof address === "string") {
      throw new Error("The organization settings measurement server did not bind to a TCP port.");
    }

    const url = `http://127.0.0.1:${String(address.port)}/workspace/organization-settings`;
    const durations: number[] = [];
    for (let index = 0; index < requests; index += 1) {
      const startedAt = performance.now();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Organization settings endpoint failed with HTTP ${String(response.status)}.`);
      }
      const body: unknown = await response.json();
      if (typeof body !== "object" || body === null || !("settings" in body)
        || !Array.isArray(body.settings) || body.settings.length !== targetVolume) {
        throw new Error(`Expected ${String(targetVolume)} settings records from the organization settings endpoint.`);
      }
      durations.push(performance.now() - startedAt);
    }

    durations.sort((left, right) => left - right);
    const p50Ms = percentile(durations, 0.50);
    const p95Ms = percentile(durations, 0.95);
    const p99Ms = percentile(durations, 0.99);
    const usesExpectedIndex = indexesUsed.includes(expectedIndex);
    const passed = p95Ms <= budgetMs && usesExpectedIndex;
    const result = {
      measuredAt: new Date(systemClock.now()).toISOString(),
      surface: "GET /workspace/organization-settings over loopback HTTP with isolated in-memory MongoDB",
      dataset: { workspaceOrganizations: targetVolume, returnedSettingsPerRequest: targetVolume, requests },
      latencyMs: { p50: p50Ms, p95: p95Ms, p99: p99Ms },
      budgetMs,
      passed,
      requiredIndex: expectedIndex,
      indexesUsed,
      queryPlanner: explanation.queryPlanner?.winningPlan ?? null,
      environment: { database: "MongoMemoryServer (disposable local instance)", runtime: process.version }
    };

    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      `../performance-results/organization-settings-${date}.json`
    );
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    console.info(JSON.stringify({ ...result, resultFile: outputPath }, null, 2));
    if (!passed) {
      throw new Error(
        `Organization settings view budget failed: p95=${String(p95Ms)}ms, ` +
        `budget=${String(budgetMs)}ms, indexes=${indexesUsed.join(",")}.`
      );
    }
  } finally {
    await server.stop().catch(() => undefined);
    await database.disconnect();
    await mongo.stop();
  }
};

await measureOrganizationSettingsBudget();
