import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp, createServer } from "../bootstrap/index.js";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { buildOrganizationQueryForPrincipal, organizationPageSize, OrganizationModel } from "../features/workspace/index.js";
import { systemClock } from "@workspace/kernel";

const budgetMs = 700;
const requests = 200;
const targetOrganizationCount = 500;
const pageSize = organizationPageSize;
const principal = { userId: "budget-owner", workspaceIds: [] } as const;
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
      workspaceIds: [],
      members: [{
        userId: principal.userId,
        email: "budget-owner@example.test",
        role: "member",
        joinedAt: new Date(systemClock.now() - index * 60_000)
      }],
      lastUsedAt: new Date(systemClock.now() - index * 60_000),
      deletedAt: null
    })));

    const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
    const usedIndexes = [...collectUsedIndexes(explanation.queryPlanner?.winningPlan)].sort();
    const usesMemberIndex = usedIndexes.includes("member_list_page");
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
      if (typeof organizations !== "object" || organizations === null
        || !("organizations" in organizations) || !Array.isArray(organizations.organizations)
        || organizations.organizations.length !== pageSize
        || !("nextOffset" in organizations) || organizations.nextOffset !== pageSize) {
        throw new Error(`Expected a ${String(pageSize)}-organization first page with offset ${String(pageSize)}; the endpoint returned an invalid page.`);
      }
      durations.push(performance.now() - startedAt);
    }

    durations.sort((left, right) => left - right);
    const p95Ms = Number((durations[Math.ceil(durations.length * 0.95) - 1] ?? 0).toFixed(2));
    const passed = p95Ms < budgetMs && usesMemberIndex;
    const result = {
      measuredAt: new Date(systemClock.now()).toISOString(),
      surface: "GET /organizations over loopback HTTP with isolated in-memory MongoDB",
      dataset: { principalOrganizations: targetOrganizationCount, pageSize, renderedOrganizations: pageSize, requests },
      p95Ms,
      budgetMs,
      passed,
      indexesUsed: usedIndexes,
      queryPlanner: explanation.queryPlanner?.winningPlan ?? null
    };
    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), `../performance-results/organization-list-story-5-${date}.json`);
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
