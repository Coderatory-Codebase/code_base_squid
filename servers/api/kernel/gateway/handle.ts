import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../constants/index.js";
import { createApplicationError } from "../../errors/index.js";

export type WorkspaceContext = {
  readonly workspaceId?: string | null;
};

export type ScopedDocument = {
  readonly _id: string;
  readonly workspaceId: string;
  readonly version: number;
  readonly deletedAt: Date | null;
};

type Filter = Readonly<Record<string, unknown>>;

/** Driver-agnostic port. integrations/mongodb isko implement karega. */
export type RawCollection<T> = {
  readonly find: (filter: Filter) => Promise<ReadonlyArray<T>>;
  readonly insertOne: (document: T) => Promise<void>;
  readonly updateOne: (filter: Filter, update: Filter) => Promise<{ readonly matchedCount: number }>;
};

export type MutationResult =
  | { readonly status: "ok" }
  | { readonly status: "conflict"; readonly code: typeof ERROR_CODES.versionConflict };

export type NewDocument<T extends ScopedDocument> = Omit<T, "workspaceId" | "version" | "deletedAt">;

/** find, insert, update, softDelete: koi unscoped method nahi. */
export type ScopedHandle<T extends ScopedDocument> = Readonly<{
  find: (filter?: Filter) => Promise<ReadonlyArray<T>>;
  insert: (document: NewDocument<T>) => Promise<void>;
  update: (id: string, expectedVersion: number, patch: Filter) => Promise<MutationResult>;
  softDelete: (id: string, expectedVersion: number) => Promise<MutationResult>;
}>;

const PROTECTED_FIELDS: ReadonlyArray<string> = ["_id", "workspaceId", "version", "deletedAt"];

const withoutProtectedFields = (patch: Filter): Filter =>
  Object.fromEntries(Object.entries(patch).filter(([key]) => !PROTECTED_FIELDS.includes(key)));

const conflict: MutationResult = { status: "conflict", code: ERROR_CODES.versionConflict };

export const createScopedHandle =
  <T extends ScopedDocument>({ collection }: { readonly collection: RawCollection<T> }) =>
  (context: WorkspaceContext): ScopedHandle<T> => {
    const { workspaceId } = context;

    // Step 4: koi query banne se pehle throw
    if (!workspaceId) {
      throw createApplicationError({
        code: ERROR_CODES.workspaceRequired,
        message: ERROR_MESSAGES.workspaceRequired,
        status: HTTP_STATUS.badRequest
      });
    }

    // Step 2: workspace predicate AAKHIR mein, caller ka filter usay override nahi kar sakta
    const scoped = (filter: Filter = {}): Filter => ({ ...filter, deletedAt: null, workspaceId });

    // Step 3: ARC-008, mutation sirf padhe hue version par
    const mutate = async (id: string, expectedVersion: number, set: Filter): Promise<MutationResult> => {
      const { matchedCount } = await collection.updateOne(
        scoped({ _id: id, version: expectedVersion }),
        { $set: set, $inc: { version: 1 } }
      );
      return matchedCount === 0 ? conflict : { status: "ok" };
    };

    return Object.freeze({
      find: (filter) => collection.find(scoped(filter)),
      insert: (document) =>
        collection.insertOne({ ...document, workspaceId, version: 1, deletedAt: null } as unknown as T),
      update: (id, expectedVersion, patch) => mutate(id, expectedVersion, withoutProtectedFields(patch)),
      softDelete: (id, expectedVersion) => mutate(id, expectedVersion, { deletedAt: new Date() })
    });
  };