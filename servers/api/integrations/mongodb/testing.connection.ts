import mongoose, { type Connection } from "mongoose";

export type MongoTestConnectionDependencies = Readonly<{
  uri: string;
  databaseName: string;
}>;

export const createMongoTestConnection = ({ uri, databaseName }: MongoTestConnectionDependencies): Promise<Connection> =>
  mongoose.createConnection(uri, {
    dbName: databaseName,
    appName: "identity-sign-in-load-test",
    serverSelectionTimeoutMS: 10_000
  }).asPromise();
