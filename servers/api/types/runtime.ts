import type { Server } from "node:http";

export type ApiServer = Readonly<{
  raw: Server;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}>;
