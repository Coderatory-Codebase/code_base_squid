import type { Server } from "node:http";
import type { ApiEnvironmentName } from "./environment.js";

export type ApiServer = Readonly<{
  raw: Server;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}>;

export type DatabaseConnection = Readonly<{
  connect: () => Promise<Readonly<{ connected: boolean }>>;
  disconnect: () => Promise<void>;
}>;

export type HealthResponse = Readonly<{
  status: "ok";
  service: string;
  environment: ApiEnvironmentName;
}>;
