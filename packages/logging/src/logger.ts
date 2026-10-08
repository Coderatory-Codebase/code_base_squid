import pino, { type DestinationStream, type LoggerOptions } from "pino";
import pretty from "pino-pretty";
import { Writable } from "node:stream";
import type { Logger, LogContext, LogLevel } from "./types.js";

type CreateLoggerOptions = Readonly<{
  service: string;
  level?: LogLevel;
  format?: "json" | "pretty";
  colorize?: boolean;
  destination?: DestinationStream;
  structuredHttpEndpoint?: string;
}>;

const createHttpDestination = (endpoint: string): DestinationStream => new Writable({
  write(chunk: Buffer, _encoding, callback) {
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-ndjson" },
      body: chunk.toString("utf8"),
      signal: AbortSignal.timeout(2_000)
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Local log receiver returned HTTP ${String(response.status)}.`);
      })
      .catch(() => undefined)
      .finally(callback);
  }
});

const write = (
  operation: (context: LogContext, message: string) => void,
  message: string,
  context: LogContext = {}
) => { operation(context, message); };

export const createLogger = ({
  service,
  level = "info",
  format = "json",
  colorize = process.stdout.isTTY,
  destination,
  structuredHttpEndpoint
}: CreateLoggerOptions): Logger => {
  const options: LoggerOptions = {
    name: service,
    level,
    base: { service },
    timestamp: pino.stdTimeFunctions.isoTime
  };
  const consoleOutput = format === "pretty"
    ? pretty({
        colorize,
        destination: destination ?? 1,
        ignore: "hostname,pid,service",
        levelFirst: true,
        sync: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l"
      })
    : destination ?? pino.destination(1);
  const output = structuredHttpEndpoint
    ? pino.multistream([
        { stream: consoleOutput },
        { stream: createHttpDestination(structuredHttpEndpoint) }
      ])
    : consoleOutput;
  const instance = pino(options, output);
  return Object.freeze({
    info: (message: string, context?: LogContext) => { write(instance.info.bind(instance), message, context); },
    warn: (message: string, context?: LogContext) => { write(instance.warn.bind(instance), message, context); },
    error: (message: string, context?: LogContext) => { write(instance.error.bind(instance), message, context); }
  });
};
