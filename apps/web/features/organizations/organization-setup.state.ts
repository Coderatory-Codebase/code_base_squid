export type OrganizationSetupActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "invalid"; message: string }>
  | Readonly<{ status: "failure"; message: string }>
  | Readonly<{ status: "conflict"; currentName: string | null }>;

export const initialOrganizationSetupState: OrganizationSetupActionState = { status: "idle" };
