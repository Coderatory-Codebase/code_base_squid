import "server-only";
import { z } from "zod";
import { createApiConfiguration, readWebEnvironment } from "@/config";

export interface InvitationListItem {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly expiresAt: Date;
}

type InvitationListResponse = Readonly<{
  invitations: readonly Readonly<{
    id: string;
    email: string;
    role: string;
    expiresAt: string;
  }>[];
}>;

type InvitationListRequest = (url: string) => Promise<InvitationListResponse>;

const invitationListResponseSchema = z.object({
  invitations: z.array(z.object({
    id: z.string().min(1),
    email: z.email(),
    role: z.string().min(1),
    expiresAt: z.iso.datetime()
  }))
}) satisfies z.ZodType<InvitationListResponse>;

const toInvitationListItem = ({ id, email, role, expiresAt }: InvitationListResponse["invitations"][number]): InvitationListItem =>
  Object.freeze({ id, email, role, expiresAt: new Date(expiresAt) });

export const createInvitationListQuery = (request: InvitationListRequest) =>
  async (baseUrl: string): Promise<readonly InvitationListItem[]> => {
    const response = await request(`${baseUrl}/identity/user-invitations`);
    return Object.freeze(response.invitations.map(toInvitationListItem));
  };

const requestInvitationList = async (url: string): Promise<InvitationListResponse> => {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" }
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
