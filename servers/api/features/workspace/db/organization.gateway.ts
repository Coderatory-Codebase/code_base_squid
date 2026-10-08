import { normalizeOrganizationId, OrganizationModel, type OrganizationDocument } from "../integrations/organization.model.js";
import type { OrganizationPage, Principal } from "../types.js";

export const organizationPageSize = 50;
export type OrganizationListDocument = Pick<OrganizationDocument, "_id" | "name" | "archivedAt">;

export type WorkspaceCondition = Readonly<{ workspaceIds: Readonly<{ $in: readonly string[] }> }>;
export type MemberCondition = Readonly<{ members: Readonly<{ $elemMatch: Readonly<{ userId: string }> }> }>;
export type OrganizationCondition = Readonly<{ ownerId: string }> | WorkspaceCondition | MemberCondition;
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
  select: (projection: Readonly<Record<string, 1>>) => OrganizationQuery;
  sort: (order: Record<string, 1 | -1>) => OrganizationQuery;
  skip: (offset: number) => OrganizationQuery;
  limit: (count: number) => OrganizationQuery;
  lean: () => Promise<OrganizationListDocument[]>;
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

const parseOrganizationListDocuments = (value: unknown): OrganizationListDocument[] => {
  if (!Array.isArray(value)) throw new Error("MongoDB returned an invalid organization list result.");
  return value.map((entry: unknown): OrganizationListDocument => {
    if (typeof entry !== "object" || entry === null || !("_id" in entry) || !("name" in entry)) {
      throw new Error("MongoDB returned an invalid organization list document.");
    }
    const name = entry.name;
    if (typeof name !== "string") {
      throw new Error("MongoDB returned an invalid organization list document.");
    }
    const archivedAt = "archivedAt" in entry && entry.archivedAt instanceof Date ? entry.archivedAt : null;
    return { _id: normalizeOrganizationId(entry._id), name, archivedAt };
  });
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
        select(projection) {
          mongooseQuery.select({ ...projection });
          return adapter;
        },
        sort(order) {
          mongooseQuery.sort(order);
          return adapter;
        },
        skip(offset) {
          mongooseQuery.skip(offset);
          return adapter;
        },
        limit(count) {
          mongooseQuery.limit(count);
          return adapter;
        },
        lean: async () => parseOrganizationListDocuments(await mongooseQuery.lean().exec()),
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
      return created.toObject();
    },
    findOneAndUpdate: async (filter, update, options) => {
      return await findOneAndUpdate({ ...filter }, { ...update }, { ...options });
    }
  };
};
const createOrganizationQuery = (
  model: OrganizationModelDependency,
  principal: Principal,
  offset: number
): OrganizationQuery => {
  const workspaceIds = [...principal.workspaceIds];

  const query = model.find();
  query.where("deletedAt").equals(null);
  query.or([
    { ownerId: principal.userId },
    { workspaceIds: { $in: workspaceIds } },
    { members: { $elemMatch: { userId: principal.userId } } }
  ]);
  query.select({ _id: 1, name: 1, archivedAt: 1 });
  query.sort({ lastUsedAt: -1, name: 1, _id: 1 });
  query.skip(offset).limit(organizationPageSize + 1);

  return query;
};

export const buildOrganizationQueryForPrincipal = (principal: Principal, offset = 0): OrganizationQuery =>
  createOrganizationQuery(createOrganizationModelDependency(OrganizationModel), principal, offset);
export type OrganizationGatewayDependencies = Readonly<{
  model?: OrganizationModelDependency;
}>;

export type OrganizationGateway = Readonly<{
  listOrganizationsForPrincipal: (principal: Principal, offset: number) => Promise<OrganizationPage<OrganizationListDocument>>;
  createOrganizationForPrincipal: (principal: Principal, name: string) => Promise<OrganizationDocument>;
  upsertPreviewOrganization: (id: string, values: Readonly<Record<string, unknown>>) => Promise<void>;
}>;

export const createOrganizationGateway = ({
  model = createOrganizationModelDependency(OrganizationModel)
}: OrganizationGatewayDependencies = {}): OrganizationGateway => {
  const listOrganizationsForPrincipal = async (
    principal: Principal,
    offset: number
  ): Promise<OrganizationPage<OrganizationListDocument>> => {
    const query = createOrganizationQuery(model, principal, offset);
    const results = await query.lean();
    const hasMore = results.length > organizationPageSize;
    return {
      organizations: results.slice(0, organizationPageSize),
      nextOffset: hasMore ? offset + organizationPageSize : null
    };
  };

  const createOrganizationForPrincipal = async (
    principal: Principal,
    name: string
  ): Promise<OrganizationDocument> => {
    if (!model.create) throw new Error("Organization creation is unavailable.");
    return model.create({
      name,
      ownerId: principal.userId,
      ...(principal.email ? { ownerEmail: principal.email } : {}),
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
