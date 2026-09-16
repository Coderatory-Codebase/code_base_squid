import { createMongoConnection, type MongoClient, type MongoConnection } from "@workspace/mongodb";
import type { Logger } from "@workspace/logging";

type MongoDbIntegrationDependencies = Readonly<{
  uri?: string;
  logger: Logger;
  client?: MongoClient;
}>;

export const createMongoDbIntegration = ({
  uri,
  logger,
  client
}: MongoDbIntegrationDependencies): MongoConnection => {
  if (!uri) {
    return Object.freeze({
      connect: (): Promise<void> => {
        logger.info("MongoDB connection is not configured; starting without persistence.");
        return Promise.resolve();
      },
      disconnect: (): Promise<void> => Promise.resolve()
    });
  }

  const connection = createMongoConnection({ uri, ...(client ? { client } : {}) });
  return Object.freeze({
    connect: async (): Promise<void> => {
      await connection.connect();
      logger.info("MongoDB connection established.");
    },
    disconnect: async (): Promise<void> => {
      await connection.disconnect();
    }
  });
};
