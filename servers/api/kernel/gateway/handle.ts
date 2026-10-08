import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../constants/index.js";
import { createApplicationError } from "../../errors/index.js";
import { systemClock, type Clock } from "@workspace/kernel";

export type WorkspaceContext = {
  readonly workspaceId?: string | null;
};

export type ScopedDocument = {
  readonly _id: string;
  readonly workspaceId: string;
  readonly version: number;
  readonly deletedAt: Date | null;
  readonly deletedCause?: string | null;
};

type Filter = Readonly<Record<string, unknown>>;

/** Driver-agnostic port. integrations/mongodb implements it. */
export type RawCollection<T> = {
  readonly find: (filter: Filter) => Promise<ReadonlyArray<T>>;
  readonly insertOne: (document: T) => Promise<void>;
  readonly updateOne: (filter: Filter, update: Filter) => Promise<{ readonly matchedCount: number }>;
};

export type MutationResult =
  | { readonly status: "ok" }
  | { readonly status: "conflict"; readonly code: typeof ERROR_CODES.versionConflict };

export type NewDocument<T extends ScopedDocument> = Omit<
  T,
  "workspaceId" | "version" | "deletedAt" | "deletedCause"
>;

/**
 * Restore path (ARC-009): the only way to see soft-deleted rows.
 * Still bound to the caller's workspace.
 */
export type RestorePath<T extends ScopedDocument> = Readonly<{
  /** Reads one row by id, deleted or not, within the caller's workspace. */
  findById: (id: string) => Promise<T | null>;
  /** Brings a soft-deleted row back, conditional on the version read (ARC-008). */
  restore: (id: string, expectedVersion: number) => Promise<MutationResult>;
}>;

/** find, insert, update, softDelete, restorePath: no unscoped method. */
export type ScopedHandle<T extends ScopedDocument> = Readonly<{
  /** Never returns soft-deleted rows, whatever filter the caller passes. */
  find: (filter?: Filter) => Promise<ReadonlyArray<T>>;
  insert: (document: NewDocument<T>) => Promise<void>;
  update: (id: string, expectedVersion: number, patch: Filter) => Promise<MutationResult>;
  /** Stamps deletedAt and deletedCause. */
  softDelete: (id: string, expectedVersion: number, cause: string) => Promise<MutationResult>;
  restorePath: RestorePath<T>;
}>;

const PROTECTED_FIELDS: ReadonlyArray<string> = [
  "_id",
  "workspaceId",
  "version",
  "deletedAt",
  "deletedCause"
];

const withoutProtectedFields = (patch: Filter): Filter =>
  Object.fromEntries(Object.entries(patch).filter(([key]) => !PROTECTED_FIELDS.includes(key)));

const conflict: MutationResult = { status: "conflict", code: ERROR_CODES.versionConflict };

export const createScopedHandle =
  <T extends ScopedDocument>({ collection, clock = systemClock }: {
    readonly collection: RawCollection<T>;
    readonly clock?: Clock;
  }) =>
  (context: WorkspaceContext): ScopedHandle<T> => {
    const { workspaceId } = context;

    // No query is built before this check.
    if (!workspaceId) {
      // The repo's error boundary recognises plain application-error objects.
      
      throw Object.assign(new Error(ERROR_MESSAGES.workspaceRequired), createApplicationError({
        code: ERROR_CODES.workspaceRequired,
        message: ERROR_MESSAGES.workspaceRequired,
        status: HTTP_STATUS.badRequest
      }));
    }

    // Workspace and soft-delete predicates go LAST so a caller filter cannot override them.
    // includeDeleted is used only by the restore path below.
    const scoped = (filter: Filter = {}, includeDeleted = false): Filter =>
      includeDeleted ? { ...filter, workspaceId } : { ...filter, deletedAt: null, workspaceId };

    const mutate = async (filter: Filter, set: Filter): Promise<MutationResult> => {
      const { matchedCount } = await collection.updateOne(filter, {
        $set: set,
        $inc: { version: 1 }
      });
      return matchedCount === 0 ? conflict : { status: "ok" };
    };

    const restorePath: RestorePath<T> = Object.freeze({
      findById: async (id) => {
        const [row] = await collection.find(scoped({ _id: id }, true));
        return row ?? null;
      },
      restore: (id, expectedVersion) =>
        mutate(scoped({ _id: id, version: expectedVersion, deletedAt: { $ne: null } }, true), {
          deletedAt: null,
          deletedCause: null
        })
    });

    return Object.freeze({
      find: (filter) => collection.find(scoped(filter)),
      insert: (document) =>
        collection.insertOne({
          ...document,
          workspaceId,
          version: 1,
          deletedAt: null,
          deletedCause: null
        } as unknown as T),
      update: (id, expectedVersion, patch) =>
        mutate(scoped({ _id: id, version: expectedVersion }), withoutProtectedFields(patch)),
      softDelete: (id, expectedVersion, cause) =>
        mutate(scoped({ _id: id, version: expectedVersion }), {
          deletedAt: new Date(clock.now()),
          deletedCause: cause
        }),
      restorePath
    });
  };