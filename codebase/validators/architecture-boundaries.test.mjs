import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { validateArchitectureBoundaries } from "./architecture-boundaries.mjs";

test("rejects a package importing application code", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "repo-boundary-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const sourceRoot = path.join(root, "packages", "ui", "src");
  await mkdir(sourceRoot, { recursive: true });
  await writeFile(path.join(sourceRoot, "button.ts"), "import '../../../apps/store/private.js';\n", "utf8");

  const findings = await validateArchitectureBoundaries({
    root,
    architecture: {
      foundation: { ignoredDirectories: [] },
      boundaries: {
        packagesCannotImport: ["apps", "servers", "prebuilt"],
        domainCannotImportSegments: ["controllers", "routes", "models"],
        domainCannotImportPackages: ["express", "mongoose", "next", "redis"],
        uiSegments: ["components", "ui"],
        persistenceSegments: ["models", "persistence", "repositories"]
      }
    },
    projects: [{ name: "ui", type: "package", root: "packages/ui" }]
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "packages-dependency-direction");
});
