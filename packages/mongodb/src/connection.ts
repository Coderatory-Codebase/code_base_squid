import mongoose from "mongoose";
import type { MongoClient, MongoConnection } from "./types.js";

type CreateMongoConnectionOptions = Readonly<{
  uri: string;
  client?: MongoClient;
  serverSelectionTimeoutMs?: number;
}>;

export const createMongoConnection = ({
  uri,
  client = mongoose,
  serverSelectionTimeoutMs = 5_000
}: CreateMongoConnectionOptions): MongoConnection => Object.freeze({
  connect: async (): Promise<void> => {
    await client.connect(uri, { serverSelectionTimeoutMS: serverSelectionTimeoutMs });
  },
  disconnect: async (): Promise<void> => {
    await client.disconnect();
  }
});
