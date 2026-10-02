import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { loadOrganizationProfile, OrganizationProfilePage, OrganizationSignInRequired } from "@/features/organization-profile";

type OrganizationProfileRouteProps = Readonly<{
  params: Promise<Readonly<{ organizationId: string }>>;
}>;

const OrganizationProfileRoute = async ({
  params
}: OrganizationProfileRouteProps): Promise<ReactElement> => {
  const { organizationId } = await params;
  const api = createApiConfiguration(readWebEnvironment());
  const result = await loadOrganizationProfile({ apiBaseUrl: api.baseUrl, organizationId });

  if (result === null) notFound();
  if (result.kind === "unauthorized") return <OrganizationSignInRequired />;
  return <OrganizationProfilePage profile={result.profile} />;
};

export default OrganizationProfileRoute;
