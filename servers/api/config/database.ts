import mongoose from "mongoose";
import type { Logger } from "@workspace/logging";
import type { DatabaseConnection } from "../types/index.js";

type MongooseConnection = Pick<typeof mongoose, "connect" | "disconnect">;

type DatabaseDependencies = Readonly<{
  uri?: string;
  logger: Logger;
  connection?: MongooseConnection;
}>;

export const createDatabase = ({ uri, logger, connection = mongoose }: DatabaseDependencies): DatabaseConnection => ({
  connect: async () => {
    if (!uri) {
      logger.info("MongoDB connection is not configured; starting without persistence.");
      return { connected: false } as const;
    }
    await connection.connect(uri, { serverSelectionTimeoutMS: 5_000 });
    logger.info("MongoDB connection established.");
    return { connected: true } as const;
  },
  disconnect: async () => {
    if (uri) await connection.disconnect();
  }
});
