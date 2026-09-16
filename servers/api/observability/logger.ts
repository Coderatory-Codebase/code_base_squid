export type LogContext = Readonly<Record<string, unknown>>;

export type Logger = Readonly<{
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
}>;

const write = (level: "info" | "warn" | "error", message: string, context: LogContext = {}) => {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context });
  const destination = level === "error" ? process.stderr : process.stdout;
  destination.write(`${entry}\n`);
};

export const createConsoleLogger = (): Logger => Object.freeze({
  info: (message, context) => { write("info", message, context); },
  warn: (message, context) => { write("warn", message, context); },
  error: (message, context) => { write("error", message, context); }
});
