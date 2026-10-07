import type { UserProfile, UserProfileQuery, UserProfileUpdateResult } from "../models/user-profile.js";
import type { UserProfileQueryPort } from "../ports/user-profile.port.js";

export type UserProfilePrincipal = Readonly<{
  userId: string;
  workspaceId: string;
}>;

export type UserProfileGateway = Readonly<{
  getUserProfile: (userId: string, principal: UserProfilePrincipal) => Promise<UserProfile | null>;
  updateUserProfile: (userId: string, principal: UserProfilePrincipal, name: string, expectedVersion: number) => Promise<UserProfileUpdateResult>;
}>;

export type UserProfileGatewayDependencies = Readonly<{ queryPort: UserProfileQueryPort }>;

export const createUserProfileGateway = ({ queryPort }: UserProfileGatewayDependencies): UserProfileGateway => ({
  getUserProfile: async (userId, principal) => {
    if (userId !== principal.userId) return null;
    const query: UserProfileQuery = {
      userId: principal.userId,
      status: "ACTIVE",
      closedAt: null
    };
    const profile = await queryPort.findOne(query);
    return profile ? { email: profile.email, name: profile.name, version: profile.version } : null;
  },
  updateUserProfile: async (userId, principal, name, expectedVersion) => {
    if (userId !== principal.userId) return { kind: "not-found" };
    return queryPort.updateOne({
      query: { userId: principal.userId, status: "ACTIVE", closedAt: null },
      name,
      expectedVersion
    });
  }
});
