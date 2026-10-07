import type { ReactElement } from "react";
import { createApiConfiguration, readWebEnvironment } from "@/config";
import { loadOrganizationProfile, OrganizationProfilePage, OrganizationProfileLoadError, OrganizationProfileUnavailable, OrganizationSignInRequired } from "@/features/organization-profile";

type OrganizationProfileRouteProps = Readonly<{
  params: Promise<Readonly<{ organizationId: string }>>;
}>;

const OrganizationProfileRoute = async ({
  params
}: OrganizationProfileRouteProps): Promise<ReactElement> => {
  const { organizationId } = await params;
  const api = createApiConfiguration(readWebEnvironment());
  const result = await loadOrganizationProfile({ apiBaseUrl: api.baseUrl, organizationId });

  if (result === null) return <OrganizationProfileUnavailable />;
  if (result.kind === "unauthorized") return <OrganizationSignInRequired />;
  const retryHref = `/organizations/${encodeURIComponent(organizationId)}`;
  if (result.kind === "error") return <OrganizationProfileLoadError retryHref={retryHref} />;
  return <OrganizationProfilePage profile={result.profile} retryHref={retryHref} />;
};

export default OrganizationProfileRoute;
