export type UserCreatedV1 = Readonly<{
  type: "UserCreated";
  version: 1;
  eventId: string;
  occurredAt: string;
  payload: Readonly<{
    userId: string;
    provider: "google" | "microsoft";
    subject: string;
    email: string;
    name: string;
  }>;
}>;