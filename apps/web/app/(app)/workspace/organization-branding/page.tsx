import type { ReactElement } from "react";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { OrganizationBrandingView, selectOrganizationBrandingPageData } from "@/features/organization-branding";
import { readTemporaryBrandingOrganizations, TemporaryBrandingApiError } from "@/features/organization-branding/temporary-live/api-gateway";
import { getTemporaryBrandingSession } from "@/features/organization-branding/temporary-live/session";
import { signOutFromTemporaryBrandingDemo } from "@/app/(public)/organization-branding-login/actions";

type OrganizationBrandingPageProps = Readonly<{
  searchParams: Promise<Readonly<{ organizationId?: string }>>;
}>;

const OrganizationBrandingPage = async ({ searchParams }: OrganizationBrandingPageProps): Promise<ReactElement> => {
  const { organizationId } = await searchParams;
  if (process.env.TEMP_ORG_BRANDING_DEMO_ENABLED !== "true") {
    return <OrganizationBrandingView data={{ kind: "unavailable" }} {...(organizationId === undefined ? {} : { organizationId })} />;
  }

  const token = await getTemporaryBrandingSession();
  if (!token) redirect("/organization-branding-login" as Route);
  let liveData;
  try {
    liveData = selectOrganizationBrandingPageData(await readTemporaryBrandingOrganizations(token), organizationId);
  } catch (error) {
    if (error instanceof TemporaryBrandingApiError && error.status === 401) redirect("/organization-branding-login?error=unavailable" as Route);
    liveData = { kind: "unavailable" } as const;
  }
  return (
    <>
      <div className="mx-auto flex max-w-7xl justify-end px-6 pt-5">
        <form action={signOutFromTemporaryBrandingDemo}><button className="rounded-md border border-input px-3 py-2 text-sm" type="submit">Sign out of demo</button></form>
      </div>
      <OrganizationBrandingView
        data={liveData}
        emptyActionHref="/workspace/organization-branding"
        emptyActionLabel="Reload organization list"
        {...(organizationId === undefined ? {} : { organizationId })}
      />
    </>
  );
};
export default OrganizationBrandingPage;
