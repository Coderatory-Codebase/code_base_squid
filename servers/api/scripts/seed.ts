import "dotenv/config";
import { createHash } from "node:crypto";
import { createLogger } from "@workspace/logging";
import { systemClock } from "@workspace/kernel";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { OrganizationModel } from "../features/workspace/index.js";

const getArgument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
};

const parseTargetVolume = (): number => {
  const raw = getArgument("--target-volume");
  const targetVolume = Number(raw);
  if (!raw || !Number.isSafeInteger(targetVolume) || targetVolume < 1 || targetVolume > 100_000) {
    throw new Error("Pass --target-volume as an integer between 1 and 100000.");
  }
  return targetVolume;
};

const seed = async (): Promise<void> => {
  if (!process.argv.includes("--confirm-load-test-seed")) {
    throw new Error("Refusing to write seed data without --confirm-load-test-seed.");
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be configured in the API environment.");
  }

  const targetVolume = parseTargetVolume();
  const workspaceId = getArgument("--workspace-id") ?? "workspace-organization-settings-load-test";
  if (!workspaceId.includes("load-test")) {
    throw new Error("Use a dedicated workspace ID containing 'load-test'.");
  }

  const logger = createLogger({ service: "organization-settings-load-seed" });
  const database = createMongoDbIntegration({ uri, logger });
  await database.connect();

  try {
    const workspaceKey = createHash("sha256").update(workspaceId).digest("hex").slice(0, 16);
    const seedNamePrefix = `Settings Load Test ${workspaceKey}-`;
    const existingSeedCount = await OrganizationModel.countDocuments({
      name: { $regex: `^${seedNamePrefix}` },
      workspaceIds: workspaceId,
      deletedAt: null
    });
    if (existingSeedCount > targetVolume) {
      throw new Error(
        `Found ${String(existingSeedCount)} seeded organizations, above target ${String(targetVolume)}. ` +
        "The script does not delete existing data; use a fresh load-test workspace."
      );
    }

    const now = new Date(systemClock.now());
    const operations = Array.from({ length: targetVolume }, (_, index) => {
      const ordinal = String(index + 1).padStart(6, "0");
      const name = `${seedNamePrefix}${ordinal}`;
      return {
        updateOne: {
          filter: { name, ownerId: "organization-settings-load-test-owner", workspaceIds: workspaceId },
          update: {
            $set: {
              name,
              ownerId: "organization-settings-load-test-owner",
              workspaceIds: [workspaceId],
              lastUsedAt: now,
              deletedAt: null,
              settings: {
                timeZone: "Europe/London",
                weekStart: "Monday",
                dateFormat: "DD/MM/YYYY",
                workspaceSetupRule: "any member"
              }
            }
          },
          upsert: true
        }
      };
    });

    await OrganizationModel.bulkWrite(operations, { ordered: false });
    const seededCount = await OrganizationModel.countDocuments({
      name: { $regex: `^${seedNamePrefix}` },
      workspaceIds: workspaceId,
      deletedAt: null
    });
    if (seededCount !== targetVolume) {
      throw new Error(
        `Expected ${String(targetVolume)} seeded organizations but found ${String(seededCount)}.`
      );
    }

    logger.info("Organization settings load-test workspace seeded.", {
      module: "workspace",
      feature: "organization-settings",
      workspaceId,
      targetVolume,
      seededCount
    });
  } finally {
    await database.disconnect();
  }
};

await seed();
