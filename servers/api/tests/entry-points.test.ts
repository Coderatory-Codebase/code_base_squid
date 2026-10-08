import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Logger } from "@workspace/logging";
import { createApp } from "../bootstrap/index.js";
import type { ApiConfig } from "../types/index.js";

type EntryPoint = string;

/** Routes that are intentionally open: no principal, no command, no policy decision. */
const PUBLIC_ENTRY_POINTS: ReadonlyArray<EntryPoint> = ["GET /health"];

/** Authenticated reads that enforce a resolved principal and feature-level scope. */
const PROTECTED_READ_ENTRY_POINTS: ReadonlyArray<EntryPoint> = [
  "GET /workspace/organization-profile/:organizationId"
];

/**
 * Routes that dispatch a command. Each one needs its command listed in
 * WAVE_1_COMMANDS in kernel/tests/pack-policy.test.ts.
 */
const COMMAND_ENTRY_POINTS: ReadonlyArray<EntryPoint> = [];

const logger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};
const config: ApiConfig = {
  environment: "test",
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent"
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Walks an Express router stack (including routers mounted with app.use) and lists "METHOD /path". */
const collectRoutes = (stack: unknown): string[] => {
  if (!Array.isArray(stack)) return [];
  const found: string[] = [];
  for (const layer of stack as unknown[]) {
    if (!isRecord(layer)) continue;
    const route = layer["route"];
    if (isRecord(route)) {
      const path = route["path"];
      const methods = route["methods"];
      if (typeof path === "string" && isRecord(methods)) {
        for (const method of Object.keys(methods)) {
          if (method !== "_all") found.push(`${method.toUpperCase()} ${path}`);
        }
      }
      continue;
    }
    const handle = layer["handle"];
    if (typeof handle === "function") {
      found.push(...collectRoutes((handle as unknown as Record<string, unknown>)["stack"]));
    }
  }
  return found;
};

const registeredRoutes = (): string[] => {
  const app = createApp({ config, logger });
  const router = (app as unknown as { router: { stack: unknown } }).router;
  return collectRoutes(router.stack).sort();
};

void describe("PACK-POLICY: entry point inventory", () => {
  void it("finds the routes the app really registers", () => {
    assert.ok(registeredRoutes().length > 0, "no routes found: the router walk is broken");
  });

  void it("every registered route is declared public or as a command entry point", () => {
    const declared = new Set([...PUBLIC_ENTRY_POINTS, ...PROTECTED_READ_ENTRY_POINTS, ...COMMAND_ENTRY_POINTS]);
    const undeclared = registeredRoutes().filter((route) => !declared.has(route));
    assert.deepEqual(
      undeclared,
      [],
      "undeclared entry point: classify it as public, a protected read, or a command"
    );
  });

  void it("every declared entry point is really registered", () => {
    const registered = new Set(registeredRoutes());
    const stale = [...PUBLIC_ENTRY_POINTS, ...PROTECTED_READ_ENTRY_POINTS, ...COMMAND_ENTRY_POINTS]
      .filter((route) => !registered.has(route));
    assert.deepEqual(stale, []);
  });

  void it("a route cannot be both public and a command entry point", () => {
    const overlap = PUBLIC_ENTRY_POINTS.filter((route) => COMMAND_ENTRY_POINTS.includes(route));
    assert.deepEqual(overlap, []);
  });

  void it("a protected read is not classified as public or a command", () => {
    const overlap = PROTECTED_READ_ENTRY_POINTS.filter((route) =>
      PUBLIC_ENTRY_POINTS.includes(route) || COMMAND_ENTRY_POINTS.includes(route)
    );
    assert.deepEqual(overlap, []);
  });
});
