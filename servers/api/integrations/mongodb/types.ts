import type { Connection } from "mongoose";

export type MongoClient = Readonly<{
  connect: (uri: string) => Promise<unknown>;
  disconnect: () => Promise<void>;
}>;

export type MongoDbIntegration = Readonly<{
  connection: Connection;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}>;
