import "dotenv/config";
import { systemClock } from "@workspace/kernel";
import { createLogger } from "@workspace/logging";
import { createApp, createServer, createShutdown } from "./bootstrap/index.js";
import { createApiConfig, readApiEnvironment } from "./config/index.js";
import { apiRuntime, outboxRuntime } from "./constants/index.js";
import { createOutboxRelayRunner } from "./features/outbox/index.js";
import { createMongoDbIntegration } from "./integrations/index.js";

const config = createApiConfig(readApiEnvironment());
const logger = createLogger({
  service: apiRuntime.serviceName,
  level: config.logLevel,
  format: config.environment === "production" ? "json" : "pretty"
});
const database = createMongoDbIntegration({
  logger,
  ...(config.mongodbUri ? { uri: config.mongodbUri } : {})
});
const app = createApp({ config, logger });
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

await database.connect();
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
