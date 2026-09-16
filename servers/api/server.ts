import "dotenv/config";
import { createLogger } from "@workspace/logging";
import { createApp } from "./bootstrap/create-app.js";
import { createServer } from "./bootstrap/create-server.js";
import { createApiConfig } from "./config/api.js";
import { createDatabase } from "./config/database.js";
import { readApiEnvironment } from "./config/env.js";
import { apiRuntime } from "./constants/runtime.js";

const config = createApiConfig(readApiEnvironment());
const logger = createLogger({ service: apiRuntime.serviceName, level: config.logLevel });
const database = createDatabase({
  logger,
  ...(config.mongodbUri ? { uri: config.mongodbUri } : {})
});
const app = createApp({ config, logger });
const server = createServer({ app, config, logger });

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  logger.info("API shutdown requested.", { signal });
  await server.stop();
  await database.disconnect();
};

await database.connect();
await server.start();

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
