import { OrganizationModel, type OrganizationDocument } from "../integrations/organization.model.js";
import type { Principal } from "../types.js";

export type WorkspaceCondition = Readonly<{ workspaceIds: Readonly<{ $in: readonly string[] }> }>;
export type OrganizationCondition = Readonly<{ ownerId: string }> | WorkspaceCondition;
export type QueryPlanValue = string | number | boolean | null | QueryPlanNode | readonly QueryPlanValue[];
export type QueryPlanNode = Readonly<{
  stage?: string;
  indexName?: string;
  queryPlanner?: QueryPlanNode;
  winningPlan?: QueryPlanValue;
  [key: string]: QueryPlanValue | undefined;
}>;
export type QueryPlanExplanation = Readonly<{ queryPlanner?: QueryPlanNode }>;

export const isQueryPlanNode = (value: QueryPlanValue): value is QueryPlanNode =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export type OrganizationQuery = Readonly<{
  where: (path: string) => OrganizationQuery;
  equals: (value: null) => OrganizationQuery;
  or: (conditions: readonly OrganizationCondition[]) => OrganizationQuery;
  sort: (order: Record<string, 1 | -1>) => OrganizationQuery;
  lean: () => Promise<OrganizationDocument[]>;
  explain: (verbosity?: "queryPlanner") => Promise<QueryPlanExplanation>;
}>;

export type OrganizationModelDependency = Readonly<{
  find: () => OrganizationQuery;
  create?: (organization: Readonly<Record<string, unknown>>) => Promise<OrganizationDocument>;
  findOneAndUpdate?: (
    filter: Readonly<Record<string, unknown>>,
    update: Readonly<Record<string, unknown>>,
    options: Readonly<Record<string, unknown>>
  ) => Promise<OrganizationDocument | null>;
}>;

const isQueryPlanExplanation = (
  value: OrganizationDocument[] | QueryPlanExplanation
): value is QueryPlanExplanation => {
  if (Array.isArray(value)) {
    return false;
  }

  return value.queryPlanner !== undefined;
};

const createOrganizationModelDependency = (
  model: typeof OrganizationModel
): OrganizationModelDependency => {
  const findOneAndUpdate = model.findOneAndUpdate.bind(model) as unknown as NonNullable<OrganizationModelDependency["findOneAndUpdate"]>;
  return {
    find: () => {
      const mongooseQuery = model.find();
      const adapter: OrganizationQuery = {
        where(path) {
          mongooseQuery.where(path);
          return adapter;
        },
        equals(value) {
          mongooseQuery.equals(value);
          return adapter;
        },
        or(conditions) {
          mongooseQuery.or([...conditions]);
          return adapter;
        },
        sort(order) {
          mongooseQuery.sort(order);
          return adapter;
        },
        lean: () => mongooseQuery.lean().exec(),
        explain: async (verbosity = "queryPlanner") => {
          const result = await mongooseQuery.explain(verbosity).exec();
          if (!isQueryPlanExplanation(result)) {
            throw new Error("MongoDB explain returned an unexpected query plan shape");
          }
          return result;
        }
      };

      return adapter;
    },
    create: async (organization) => {
      const created = await model.create({ ...organization });
      return created.toObject() as OrganizationDocument;
    },
    findOneAndUpdate: async (filter, update, options) => {
      return await findOneAndUpdate({ ...filter }, { ...update }, { ...options });
    }
  };
};
const createOrganizationQuery = (
  model: OrganizationModelDependency,
  principal: Principal
): OrganizationQuery => {
  const workspaceIds = [...principal.workspaceIds];

  const query = model.find();
  query.where("deletedAt").equals(null);
  query.or([{ ownerId: principal.userId }, { workspaceIds: { $in: workspaceIds } }]);
  query.sort({ lastUsedAt: -1, name: 1 });

  return query;
};

export const buildOrganizationQueryForPrincipal = (principal: Principal): OrganizationQuery =>
  createOrganizationQuery(createOrganizationModelDependency(OrganizationModel), principal);
export type OrganizationGatewayDependencies = Readonly<{
  model?: OrganizationModelDependency;
}>;

export type OrganizationGateway = Readonly<{
  listOrganizationsForPrincipal: (principal: Principal) => Promise<readonly OrganizationDocument[]>;
  createOrganizationForPrincipal: (principal: Principal, name: string) => Promise<OrganizationDocument>;
  upsertPreviewOrganization: (id: string, values: Readonly<Record<string, unknown>>) => Promise<void>;
}>;

export const createOrganizationGateway = ({
  model = createOrganizationModelDependency(OrganizationModel)
}: OrganizationGatewayDependencies = {}): OrganizationGateway => {
  const listOrganizationsForPrincipal = async (
    principal: Principal
  ): Promise<readonly OrganizationDocument[]> => {
    const query = createOrganizationQuery(model, principal);

    return query.lean();
  };

  const createOrganizationForPrincipal = async (
    principal: Principal,
    name: string
  ): Promise<OrganizationDocument> => {
    if (!model.create) throw new Error("Organization creation is unavailable.");
    return model.create({
      name,
      ownerId: principal.userId,
      workspaceIds: [],
      lastUsedAt: new Date(),
      deletedAt: null
    });
  };

  const upsertPreviewOrganization = async (id: string, values: Readonly<Record<string, unknown>>): Promise<void> => {
    if (!model.findOneAndUpdate) throw new Error("Organization fixture upsert is unavailable.");
    await model.findOneAndUpdate({ _id: id }, { $set: values }, { upsert: true, returnDocument: "after" });
  };

  return { listOrganizationsForPrincipal, createOrganizationForPrincipal, upsertPreviewOrganization };
};
