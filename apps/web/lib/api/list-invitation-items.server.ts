import "server-only";
import { cookies } from "next/headers";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import {
  createInvitationListQuery,
  invitationListResponseSchema,
  type InvitationListItem,
  type InvitationListRequest
} from "./user-invitation";

const requestInvitationList: InvitationListRequest = async (url) => {
  const sessionToken = (await cookies()).get("workspace_session")?.value;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to load invitations (${response.status}).`);
  }

  return invitationListResponseSchema.parse(await response.json());
};

export const listInvitationItems = (): Promise<readonly InvitationListItem[]> => {
  const api = createApiConfiguration(readWebEnvironment());
  return createInvitationListQuery(requestInvitationList)(api.baseUrl);
};
