import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedModels = new Map([
  ["features/auth/integrations/session.model.ts", { name: "Session", collection: "sessions" }],
  ["features/auth/integrations/user.model.ts", { name: "User", collection: "users" }],
  ["features/identity/models/user-invitation.model.ts", { name: "UserInvitation", collection: "user_invitations" }],
  ["features/workspace/integrations/organization.model.ts", { name: "Organization", collection: "organizations" }]
]);

const findModelFiles = async (directory: string): Promise<readonly string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.isDirectory()) {
      return ["node_modules", "dist", "build", "coverage"].includes(entry.name)
        ? []
        : await findModelFiles(path.join(directory, entry.name));
    }
    return entry.isFile() && entry.name.endsWith(".model.ts")
      ? [path.relative(apiRoot, path.join(directory, entry.name)).split(path.sep).join("/")]
      : [];
  }));
  return nested.flat().sort();
};

void test("Mongoose model definitions use only explicitly allow-listed collections", async () => {
  const modelFiles = await findModelFiles(apiRoot);
  assert.deepEqual(modelFiles, [...allowedModels.keys()].sort());

  for (const [relativePath, allowed] of allowedModels) {
    const source = await readFile(path.join(apiRoot, relativePath), "utf8");
    const modelName = source.match(/model(?:<[^>]+>)?\s*\(\s*"([^"]+)"/u)?.[1];
    const explicitCollection = source.match(/model(?:<[^>]+>)?\s*\(\s*"[^"]+",\s*\w+,\s*"([^"]+)"/u)?.[1];
    const schemaCollection = explicitCollection ?? source.match(/collection:\s*"([^"]+)"/u)?.[1];
    assert.deepEqual(
      modelName ? [modelName, schemaCollection] : undefined,
      [allowed.name, allowed.collection],
      relativePath
    );
  }
});
