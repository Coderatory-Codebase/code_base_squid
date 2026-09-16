import { createApp } from "./bootstrap/create-app.js";
import { createServer } from "./bootstrap/create-server.js";
import { createDatabase } from "./config/database.js";
import { readApiConfig } from "./config/environment.js";
import { createConsoleLogger } from "./observability/logger.js";

const config = readApiConfig();
const logger = createConsoleLogger();
const database = createDatabase({
  logger,
  ...(config.mongodbUri ? { uri: config.mongodbUri } : {})
});
const app = createApp({ config, logger });
const server = createServer({ app, config, logger });

const shutdown = async (signal: NodeJS.Signals) => {
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
