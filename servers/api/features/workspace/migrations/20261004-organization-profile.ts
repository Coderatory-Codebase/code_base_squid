import type { Connection } from "mongoose";
import {
  ORGANIZATION_PROFILE_COLLECTION,
  organizationProfileWorkspaceIndex,
  organizationProfileWorkspaceIndexOptions
} from "../organization-profile.schema.js";

export const up = async (connection: Connection): Promise<void> => {
  await connection.collection(ORGANIZATION_PROFILE_COLLECTION).createIndex(
    organizationProfileWorkspaceIndex,
    organizationProfileWorkspaceIndexOptions
  );
};

export const down = async (connection: Connection): Promise<void> => {
  await connection.collection(ORGANIZATION_PROFILE_COLLECTION).dropIndex(organizationProfileWorkspaceIndexOptions.name);
};
