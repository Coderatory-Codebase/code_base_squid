import "dotenv/config";
import { systemClock } from "@workspace/kernel";
import "./config/dns-override.js";
import { createLogger } from "@workspace/logging";
import { createApp, createIdentityRuntime, createServer, createShutdown } from "./bootstrap/index.js";
import { createApiConfig, readApiEnvironment } from "./config/index.js";
import { apiRuntime, outboxRuntime } from "./constants/index.js";
import { createOutboxRelayRunner } from "./features/outbox/index.js";
import { createMongoDbIntegration, workspaceBrandingMongoQueries } from "./integrations/index.js";
import { initializeIdentityMongoCollections } from "./features/identity/index.js";

const config = createApiConfig(readApiEnvironment());
const logger = createLogger({
  service: apiRuntime.serviceName,
  level: config.logLevel,
  format: config.logFormat ?? (config.environment === "production" ? "json" : "pretty"),
  ...(config.environment === "development"
    ? { structuredHttpEndpoint: "http://127.0.0.1:3101/loki/api/v1/raw" }
    : {})
});
const database = createMongoDbIntegration({
  logger,
  ...(config.mongodbUri ? { uri: config.mongodbUri } : {})
});
const identity = config.mongodbUri ? createIdentityRuntime(database, config, logger) : undefined;
const app = createApp({
  config,
  logger,
  ...(identity ? { identity: identity.profile } : {}),
  ...(identity ? { userInvitations: identity.userInvitations } : {}),
  ...(identity ? { identitySessions: identity.sessionManagement } : {}),
  ...(identity?.authentication ? { authentication: identity.authentication } : {}),
  ...(config.temporaryOrganizationBrandingDemo ? { temporaryBrandingDemoReader: workspaceBrandingMongoQueries } : {})
});
const server = createServer({ app, config, logger });
const relay = createOutboxRelayRunner({
  ...(config.mongodbUri && config.redisUrl ? { redisUrl: config.redisUrl } : {}),
  queueName: outboxRuntime.queueName,
  pollIntervalMs: outboxRuntime.pollIntervalMs,
  batchSize: outboxRuntime.batchSize,
  publishTimeoutMs: outboxRuntime.publishTimeoutMs,
  leaseTtlMs: outboxRuntime.leaseTtlMs,
  backlogAlertAfterMs: outboxRuntime.backlogAlertAfterMs,
  clock: systemClock,
  logger
});

const shutdown = createShutdown({ database, logger, relay, server });

try {
  await database.connect();
  if (config.mongodbUri) await initializeIdentityMongoCollections();
} catch (error: unknown) {
  if (config.environment === "production") throw error;
  logger.warn("MongoDB connection failed; starting without persistence in development.", {
    error: error instanceof Error ? error.message : String(error)
  });
}
await server.start();
relay.start();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal)
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.error("API shutdown failed.", { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
      });
  });
}
