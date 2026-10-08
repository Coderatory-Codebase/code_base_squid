import { z } from "zod";

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

export type InvitationListRequest = (url: string) => Promise<InvitationListResponse>;

export const invitationListResponseSchema = z.object({
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
