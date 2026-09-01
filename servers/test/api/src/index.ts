import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";

async function main(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`servers/api listening on port ${env.port}`);
  });
}

main().catch((err: unknown) => {
  console.error("servers/api failed to start:", err);
  process.exit(1);
});
