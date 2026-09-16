import { createServer as createNodeServer } from "node:http";
import type { Express } from "express";
import type { Logger } from "@workspace/logging";
import type { ApiConfig } from "../config/api.js";

type ServerDependencies = Readonly<{ app: Express; config: ApiConfig; logger: Logger }>;

export const createServer = ({ app, config, logger }: ServerDependencies) => {
  const server = createNodeServer(app);
  return {
    raw: server,
    start: () => new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.port, config.host, () => {
        server.off("error", reject);
        logger.info("API server started.", { host: config.host, port: config.port });
        resolve();
      });
    }),
    stop: () => new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    })
  };
};
