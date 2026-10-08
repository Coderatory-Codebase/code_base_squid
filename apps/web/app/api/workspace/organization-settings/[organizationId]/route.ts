import { cookies } from "next/headers";
import { organizationSettingInputSchema } from "@/app/(app)/workspace/_actions/organization-setting.schema";
import { updateOrganizationSettings } from "@/lib/api/update-organization-settings.server";

type RouteContext = Readonly<{ params: Promise<Readonly<{ organizationId: string }>> }>;

export const PATCH = async (request: Request, context: RouteContext): Promise<Response> => {
  const token = (await cookies()).get("workspace_session")?.value;
  if (!token) return Response.json({ error: { code: "unauthorized", message: "Sign in to continue." } }, { status: 401 });

  const { organizationId } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: { code: "validation_error", message: "Request validation failed." } }, { status: 400 });
  }
  const parsed = organizationSettingInputSchema.safeParse({ ...body, organizationId });
  if (!parsed.success) {
    return Response.json({ error: { code: "validation_error", message: "Request validation failed." } }, { status: 400 });
  }

  try {
    const result = await updateOrganizationSettings(token, parsed.data);
    return Response.json(result.payload, { status: result.status });
  } catch {
    return Response.json({ error: { code: "service_unavailable", message: "The organization settings service could not be reached." } }, { status: 503 });
  }
};
