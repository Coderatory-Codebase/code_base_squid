import type { UserProfile, UserProfileQuery } from "../models/user-profile.js";
import type { UserProfileQueryPort } from "../ports/user-profile.port.js";

export type UserProfilePrincipal = Readonly<{
  userId: string;
  workspaceId: string;
}>;

export type UserProfileGateway = Readonly<{
  getUserProfile: (userId: string, principal: UserProfilePrincipal) => Promise<UserProfile | null>;
}>;

export type UserProfileGatewayDependencies = Readonly<{ queryPort: UserProfileQueryPort }>;

export const createUserProfileGateway = ({ queryPort }: UserProfileGatewayDependencies): UserProfileGateway => ({
  getUserProfile: async (userId, principal) => {
    const query: UserProfileQuery = {
      userProfileId: userId,
      deletedAt: null,
      workspaceId: principal.workspaceId
    };
    const profile = await queryPort.findOne(query);
    return profile ? { name: profile.name } : null;
  }
});