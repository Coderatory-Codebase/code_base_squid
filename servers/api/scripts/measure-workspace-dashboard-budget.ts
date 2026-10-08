import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp, createServer } from "../bootstrap/index.js";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { OrganizationModel } from "../features/workspace/index.js";

const budgetMs = 700;
const payloadBudgetBytes = 100 * 1024;
const requests = 200;
const memberCount = 20;
const activityCount = 50;
const organizationId = "000000000000000000000051";
const principal = { userId: "dashboard-owner", email: "owner@example.test", workspaceIds: [] } as const;
const logger = {
  info: (_message: string, _context?: Record<string, unknown>): void => undefined,
  warn: (_message: string, _context?: Record<string, unknown>): void => undefined,
  error: (_message: string, _context?: Record<string, unknown>): void => undefined
};
const config = {
  environment: "test" as const,
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent" as const
};

const measureWorkspaceDashboardBudget = async (): Promise<void> => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const database = createMongoDbIntegration({ uri: mongo.getUri(), logger });
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
      name: "Workspace dashboard budget",
      ownerId: principal.userId,
      ownerEmail: principal.email,
      workspaceIds: Array.from({ length: 10 }, (_, index) => `workspace-${String(index)}`),
      members: Array.from({ length: memberCount }, (_, index) => ({
        userId: `dashboard-member-${String(index)}`,
        email: `member-${String(index)}@example.test`,
        role: index % 5 === 0 ? "admin" : "member",
        joinedAt: new Date(Date.now() - index * 1_000)
      })),
      invitations: [],
      activity: Array.from({ length: activityCount }, (_, index) => ({
        actorId: principal.userId,
        action: "member_role_changed",
        target: `dashboard-member-${String(index)}`,
        createdAt: new Date(Date.now() - index * 60_000)
      })),
      deletedAt: null
    });

    await server.start();
    const address = server.raw.address();
    if (!address || typeof address === "string") throw new Error("The workspace dashboard measurement server did not bind to a TCP port.");
    const url = `http://127.0.0.1:${String(address.port)}/organizations/${organizationId}/dashboard`;
    const durations: number[] = [];
    let payloadBytes = 0;
    for (let index = 0; index < requests; index += 1) {
      const startedAt = performance.now();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Workspace dashboard endpoint failed with HTTP ${String(response.status)}.`);
      const text = await response.text();
      payloadBytes = Buffer.byteLength(text);
      const dashboard: unknown = JSON.parse(text);
      if (typeof dashboard !== "object" || dashboard === null
        || !("metrics" in dashboard) || typeof dashboard.metrics !== "object" || dashboard.metrics === null
        || !("activeTeamMembers" in dashboard.metrics) || dashboard.metrics.activeTeamMembers !== memberCount + 1) {
        throw new Error("Workspace dashboard returned incomplete team metrics.");
      }
      durations.push(performance.now() - startedAt);
    }

    durations.sort((left, right) => left - right);
    const p95Ms = Number((durations[Math.ceil(durations.length * 0.95) - 1] ?? 0).toFixed(2));
    const passed = p95Ms < budgetMs && payloadBytes <= payloadBudgetBytes;
    const result = {
      measuredAt: new Date().toISOString(),
      surface: "GET /organizations/:organizationId/dashboard over loopback with isolated in-memory MongoDB",
      dataset: { activeTeamMembers: memberCount + 1, linkedWorkspaces: 10, recentActivityEvents: 10, requests },
      p95Ms,
      budgetMs,
      payloadBytes,
      payloadBudgetBytes,
      passed
    };
    const date = result.measuredAt.slice(0, 10);
    const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), `../performance-results/workspace-dashboard-${date}.json`);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`).catch(async (error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "EEXIST") {
        await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
        return;
      }
      throw error;
    });
    console.info(JSON.stringify({ ...result, resultFile: outputPath }, null, 2));
    if (!passed) throw new Error(`Workspace dashboard budget failed: p95=${String(p95Ms)} ms, payload=${String(payloadBytes)} bytes.`);
  } finally {
    await server.stop().catch(() => undefined);
    await database.disconnect();
    await mongo.stop();
  }
};

await measureWorkspaceDashboardBudget();
