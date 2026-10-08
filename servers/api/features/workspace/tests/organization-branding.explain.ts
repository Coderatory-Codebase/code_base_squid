import "dotenv/config";
import { runOrganizationBrandingExplainProbe } from "../../../integrations/index.js";
import { explainUsesOrganizationBrandingIndex } from "../organization-branding.mongo-reader.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI must be configured to run the read-only explain check.");
}

try {
  const plan = await runOrganizationBrandingExplainProbe(uri);
  if (!explainUsesOrganizationBrandingIndex(plan)) {
    throw new Error("The MongoDB winning and executed plans did not use the expected index.");
  }
  process.stdout.write("The explain plan uses the organization-branding covering index.\n");
} catch (error) {
  const record = error instanceof Error ? error as Error & { code?: string } : undefined;
  const safeMessage = (record?.message ?? "Unknown error")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s'"<>]+/gi, "mongodb://[redacted]");
  process.stderr.write(`Organization-branding explain failed${record?.code ? ` (${record.code})` : ""}: ${safeMessage}\n`);
  process.exitCode = 1;
}
