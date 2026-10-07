import "dotenv/config";
import { runOrganizationBrandingBudgetMeasurement } from "../integrations/index.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI must be configured to run the T5 benchmark.");
}

try {
  const result = await runOrganizationBrandingBudgetMeasurement(uri);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.withinBudget) process.exitCode = 1;
} catch (error) {
  const record = error instanceof Error ? error as Error & { code?: string } : undefined;
  const safeMessage = (record?.message ?? "Unknown error")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"<>]+/gi, "mongodb://[redacted]");
  process.stderr.write(`Organization-branding T5 benchmark failed${record?.code ? ` (${record.code})` : ""}: ${safeMessage}\n`);
  process.exitCode = 1;
}
