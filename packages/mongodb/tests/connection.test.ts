import test from "node:test";
import assert from "node:assert/strict";
import { createMongoConnection, type MongoClient } from "../src/index.js";

void test("connects and disconnects through the injected Mongo client boundary", async (): Promise<void> => {
  const calls: string[] = [];
  const client: MongoClient = {
    connect: (uri, options): Promise<void> => {
      calls.push(`${uri}:${String(options.serverSelectionTimeoutMS)}`);
      return Promise.resolve();
    },
    disconnect: (): Promise<void> => {
      calls.push("disconnect");
      return Promise.resolve();
    }
  };
  const connection = createMongoConnection({
    uri: "mongodb://example.test/workspace",
    client,
    serverSelectionTimeoutMs: 250
  });

  await connection.connect();
  await connection.disconnect();

  assert.deepEqual(calls, ["mongodb://example.test/workspace:250", "disconnect"]);
});
