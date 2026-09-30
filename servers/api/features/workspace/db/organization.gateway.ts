import { OrganizationModel, type OrganizationDocument } from "../integrations/organization.model.js";
import type { Principal } from "../types.js";

type OrganizationQuery = Readonly<{
  where: (path: string) => OrganizationQuery;
  equals: (value: unknown) => OrganizationQuery;
  or: (conditions: readonly Record<string, unknown>[]) => OrganizationQuery;
  in: (values: readonly unknown[]) => OrganizationQuery;
  sort: (order: Record<string, 1 | -1>) => OrganizationQuery;
  lean: <T>() => Promise<T>;
  explain: (verbosity?: "queryPlanner") => Promise<unknown>;
  getQuery: () => Record<string, unknown>;
}>;

type OrganizationModelDependency = Readonly<{
  find: () => OrganizationQuery;
}>;

const createOrganizationQuery = (
  model: OrganizationModelDependency,
  principal: Principal
): OrganizationQuery => {
  const workspaceIds = [...principal.workspaceIds];

  const query = model.find();
  query.where("deletedAt").equals(null);
  query.or([{ ownerId: principal.userId }, { workspaceIds: { $in: workspaceIds } }]);
  query.where("workspaceIds").in(workspaceIds);
  query.sort({ lastUsedAt: -1, name: 1 });

  return query;
};

export const buildOrganizationQueryForPrincipal = (principal: Principal): OrganizationQuery =>
  createOrganizationQuery(OrganizationModel as unknown as OrganizationModelDependency, principal);
export type OrganizationGatewayDependencies = Readonly<{
  model?: OrganizationModelDependency;
}>;

export type OrganizationGateway = Readonly<{
  listOrganizationsForPrincipal: (principal: Principal) => Promise<readonly OrganizationDocument[]>;
}>;

export const createOrganizationGateway = ({
  model = OrganizationModel as unknown as OrganizationModelDependency
}: OrganizationGatewayDependencies = {}): OrganizationGateway => {
  const listOrganizationsForPrincipal = async (
    principal: Principal
  ): Promise<readonly OrganizationDocument[]> => {
    const query = createOrganizationQuery(model, principal);

    return query.lean<OrganizationDocument[]>();
  };

  return { listOrganizationsForPrincipal };
};
