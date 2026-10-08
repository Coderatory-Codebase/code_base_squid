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
import { OrganizationModel } from "../features/workspace/index.js";

const durationMs = 10 * 60 * 1000;
const targetRequestsPerSecond = 20;
const intervalMs = 1000 / targetRequestsPerSecond;
const budgetMs = 300;
const organizationId = "000000000000000000000003";
const workspaceId = "organization-settings-updates-budget";
const principal: Principal = { userId: "organization-settings-updates-owner", workspaceIds: [workspaceId] };
const logger = {
  info: (_message: string, _context?: Record<string, unknown>): void => undefined,
  warn: (_message: string, _context?: Record<string, unknown>): void => undefined,
  error: (_message: string, _context?: Record<string, unknown>): void => undefined
};

const percentile = (durations: readonly number[], fraction: number): number =>
  Number((durations[Math.ceil(durations.length * fraction) - 1] ?? 0).toFixed(2));

const delay = async (milliseconds: number): Promise<void> => {
  if (milliseconds > 0) await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds));
};

const measureOrganizationSettingsUpdates = async (): Promise<void> => {
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
    await OrganizationModel.create({
      _id: organizationId,
      name: "Organization settings updates budget",
      ownerId: principal.userId,
      workspaceIds: [workspaceId],
      settings: {
        timeZone: "Europe/London",
        weekStart: "Monday",
        dateFormat: "DD/MM/YYYY",
        workspaceSetupRule: "any member"
      },
      version: 1,
      deletedAt: null
    });
    await server.start();
    const address = server.raw.address();
    if (!address || typeof address === "string") {
      throw new Error("The organization settings update measurement server did not bind to a TCP port.");
    }

    const url = `http://127.0.0.1:${String(address.port)}/organizations/${organizationId}/settings`;
    const durations: number[] = [];
    const startedAt = performance.now();
    let successfulUpdates = 0;
    for (let index = 0; performance.now() - startedAt < durationMs; index += 1) {
      await delay(index * intervalMs - (performance.now() - startedAt));
      const requestStartedAt = performance.now();
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedVersion: index + 1,
          settings: { weekStart: index % 2 === 0 ? "Sunday" : "Monday" }
        })
      });
      if (!response.ok) {
        throw new Error(`Organization settings update failed with HTTP ${String(response.status)} at request ${String(index + 1)}.`);
      }
      const result: unknown = await response.json();
      if (typeof result !== "object" || result === null || !("status" in result) || result.status !== "updated") {
        throw new Error(`Organization settings update returned an unexpected result at request ${String(index + 1)}.`);
      }
      durations.push(performance.now() - requestStartedAt);
      successfulUpdates += 1;
    }

    durations.sort((left, right) => left - right);
    const elapsedMs = Number((performance.now() - startedAt).toFixed(2));
    const achievedRequestsPerSecond = Number((successfulUpdates * 1000 / elapsedMs).toFixed(2));
    const p50Ms = percentile(durations, 0.50);
    const p95Ms = percentile(durations, 0.95);
    const p99Ms = percentile(durations, 0.99);
    const passed = achievedRequestsPerSecond >= targetRequestsPerSecond && p95Ms <= budgetMs;
    const result = {
      measuredAt: new Date(systemClock.now()).toISOString(),
      surface: "PATCH /organizations/:organizationId/settings over loopback HTTP with isolated in-memory MongoDB",
      workload: { targetRequestsPerSecond, successfulUpdates, elapsedMs, achievedRequestsPerSecond },
      latencyMs: { p50: p50Ms, p95: p95Ms, p99: p99Ms },
      budgetMs,
      passed,
      environment: { database: "MongoMemoryServer (disposable local instance)", runtime: process.version }
    };

    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      `../performance-results/organization-settings-updates-${date}.json`
    );
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    console.info(JSON.stringify({ ...result, resultFile: outputPath }, null, 2));
    if (!passed) {
      throw new Error(
        `Organization settings update budget failed: rate=${String(achievedRequestsPerSecond)} req/s ` +
        `(target ${String(targetRequestsPerSecond)}), p95=${String(p95Ms)}ms (budget ${String(budgetMs)}ms).`
      );
    }
  } finally {
    await server.stop().catch(() => undefined);
    await database.disconnect();
    await mongo.stop();
  }
};

await measureOrganizationSettingsUpdates();
