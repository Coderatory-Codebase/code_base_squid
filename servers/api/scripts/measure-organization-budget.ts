import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp, createServer } from "../bootstrap/index.js";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { OrganizationModel } from "../features/workspace/integrations/organization.model.js";
import { buildOrganizationQueryForPrincipal } from "../features/workspace/db/organization.gateway.js";

const budgetMs = 700;
const requests = 200;
const targetOrganizationCount = 50;
const principal = { userId: "budget-owner", workspaceIds: ["workspace-budget"] } as const;
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

const measureOrganizationBudget = async (): Promise<void> => {
  // Always use a disposable in-memory MongoDB. Never connect to MONGODB_URI from .env.
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const database = createMongoDbIntegration({
    uri: mongo.getUri(),
    logger
  });
  const server = createServer({
    app: createApp({
      config: { environment: "test", host: "127.0.0.1", port: 0, webOrigin: "http://localhost:3000", logLevel: "silent" },
      logger,
      resolvePrincipal: () => principal
    }),
    config: { environment: "test", host: "127.0.0.1", port: 0, webOrigin: "http://localhost:3000", logLevel: "silent" },
    logger
  });

  try {
    await database.connect();
    await OrganizationModel.init();
    await OrganizationModel.insertMany(Array.from({ length: targetOrganizationCount }, (_, index) => ({
      _id: String(index + 1).padStart(24, "0"),
      name: `Budget organization ${String(index + 1)}`,
      ownerId: index % 2 === 0 ? principal.userId : `member-owner-${String(index)}`,
      workspaceIds: ["workspace-budget"],
      lastUsedAt: new Date(Date.now() - index * 60_000),
      deletedAt: null
    })));

    const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
    const usedIndexes = [...collectUsedIndexes(explanation.queryPlanner?.winningPlan)].sort();
    const usesWorkspaceIndex = usedIndexes.includes("workspaceIds_1");
    await server.start();
    const address = server.raw.address();
    if (!address || typeof address === "string") throw new Error("The organization measurement server did not bind to a TCP port.");
    const url = `http://127.0.0.1:${String(address.port)}/organizations`;
    const durations: number[] = [];

    for (let index = 0; index < requests; index += 1) {
      const startedAt = performance.now();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Organization endpoint failed with HTTP ${String(response.status)}.`);
      const organizations: unknown = await response.json();
      if (!Array.isArray(organizations) || organizations.length !== targetOrganizationCount) {
        throw new Error(`Expected ${String(targetOrganizationCount)} organizations; received ${String(Array.isArray(organizations) ? organizations.length : "invalid response")}.`);
      }
      durations.push(performance.now() - startedAt);
    }

    durations.sort((left, right) => left - right);
    const p95Ms = Number((durations[Math.ceil(durations.length * 0.95) - 1] ?? 0).toFixed(2));
    const passed = p95Ms < budgetMs && usesWorkspaceIndex;
    const result = {
      measuredAt: new Date().toISOString(),
      surface: "GET /organizations over loopback HTTP with isolated in-memory MongoDB",
      dataset: { principalOrganizations: targetOrganizationCount, requests },
      p95Ms,
      budgetMs,
      passed,
      indexesUsed: usedIndexes,
      queryPlanner: explanation.queryPlanner?.winningPlan ?? null
    };
    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), `../performance-results/organization-list-${date}.json`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" }).catch(async (error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "EEXIST") {
        await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
        return;
      }
      throw error;
    });
    console.info(JSON.stringify({ ...result, resultFile: outputPath }, null, 2));
    if (!passed) throw new Error(`Organization view budget failed: p95=${String(p95Ms)}ms, budget=${String(budgetMs)}ms, indexes=${result.indexesUsed.join(",")}.`);
  } finally {
    await server.stop().catch(() => undefined);
    await database.disconnect();
    await mongo.stop();
  }
};

await measureOrganizationBudget();
