import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { systemClock } from "@workspace/kernel";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp, createServer } from "../bootstrap/index.js";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { OrganizationModel } from "../features/workspace/index.js";

const requestRatePerSecond = 20;
const durationMs = 10 * 60 * 1000;
const budgetMs = 300;
const principal = { userId: "setup-budget-owner", workspaceIds: [] } as const;
const logger = {
  info: (_message: string, _context?: Record<string, unknown>): void => undefined,
  warn: (_message: string, _context?: Record<string, unknown>): void => undefined,
  error: (_message: string, _context?: Record<string, unknown>): void => undefined
};

const delayUntil = async (targetTime: number): Promise<void> => {
  const remainingMs = targetTime - performance.now();
  if (remainingMs > 0) await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, remainingMs));
};

const measureOrganizationSetupBudget = async (): Promise<void> => {
  // Always use a disposable in-memory MongoDB. Never read or connect to MONGODB_URI.
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const config = {
    environment: "test" as const,
    host: "127.0.0.1",
    port: 0,
    webOrigin: "http://localhost:3000",
    logLevel: "silent" as const
  };
  const database = createMongoDbIntegration({ uri: mongo.getUri(), logger });
  const server = createServer({
    app: createApp({ config, logger, resolvePrincipal: () => principal }),
    config,
    logger
  });

  try {
    await database.connect();
    await OrganizationModel.init();
    await server.start();
    const address = server.raw.address();
    if (!address || typeof address === "string") throw new Error("The organization setup measurement server did not bind to a TCP port.");
    const url = `http://127.0.0.1:${String(address.port)}/organizations`;
    const durations: number[] = [];
    let failedRequests = 0;
    const measurementStartedAt = performance.now();
    const requestCount = Math.floor(durationMs * requestRatePerSecond / 1000);
    const requestTasks: Promise<void>[] = [];

    for (let index = 0; index < requestCount; index += 1) {
      await delayUntil(measurementStartedAt + index * 1000 / requestRatePerSecond);
      requestTasks.push((async () => {
        const startedAt = performance.now();
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: `Setup budget organization ${String(index + 1)}` })
          });
          const payload: unknown = await response.json();
          const validPayload = typeof payload === "object" && payload !== null &&
            "id" in payload && typeof payload.id === "string" &&
            "name" in payload && typeof payload.name === "string";
          if (!response.ok || !validPayload) {
            failedRequests += 1;
            return;
          }
          durations.push(performance.now() - startedAt);
        } catch {
          failedRequests += 1;
        }
      })());
    }
    await Promise.all(requestTasks);

    durations.sort((left, right) => left - right);
    const p95Ms = Number((durations[Math.ceil(durations.length * 0.95) - 1] ?? 0).toFixed(2));
    const passed = failedRequests === 0 && durations.length === requestCount && p95Ms < budgetMs;
    const result = {
      measuredAt: new Date(systemClock.now()).toISOString(),
      surface: "POST /organizations over loopback HTTP with isolated in-memory MongoDB",
      workload: { requestsPerSecond: requestRatePerSecond, durationMs, requests: requestCount },
      completedRequests: durations.length,
      failedRequests,
      p95Ms,
      budgetMs,
      passed
    };
    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), `../performance-results/organization-setup-${date}.json`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
    console.info(JSON.stringify({ ...result, resultFile: outputPath }, null, 2));
    if (!passed) throw new Error(`Organization setup budget failed: ${String(failedRequests)} failed requests, p95=${String(p95Ms)}ms, budget=${String(budgetMs)}ms.`);
  } finally {
    await server.stop().catch(() => undefined);
    await database.disconnect();
    await mongo.stop();
  }
};

await measureOrganizationSetupBudget();
