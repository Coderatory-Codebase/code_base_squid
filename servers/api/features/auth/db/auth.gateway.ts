import { SessionModel } from "../integrations/session.model.js";
import { UserModel } from "../integrations/user.model.js";

type UserRecord = Readonly<{ _id: string; email: string; passwordHash: string; workspaceIds: readonly string[] }>;
type Query = Readonly<{ lean: <T>() => Promise<T> }>;
type UserModelDependency = Readonly<{
  findOne: (filter: Readonly<Record<string, unknown>>) => Query;
  findById: (id: string) => Query;
  findOneAndUpdate: (
    filter: Readonly<Record<string, unknown>>,
    update: Readonly<Record<string, unknown>>,
    options: Readonly<Record<string, unknown>>
  ) => Promise<UserRecord | null>;
}>;
type SessionModelDependency = Readonly<{
  create: (session: AuthSession) => Promise<unknown>;
  findOne: (filter: Readonly<Record<string, unknown>>) => Query;
  deleteOne: (filter: Readonly<Record<string, unknown>>) => Promise<unknown>;
}>;

export type AuthUser = Readonly<{
  id: string;
  email: string;
  passwordHash: string;
  workspaceIds: readonly string[];
}>;

export type AuthSession = Readonly<{ sessionId: string; tokenHash: string; userId: string; expiresAt: Date }>;

export type AuthGateway = Readonly<{
  findUserByEmail: (email: string) => Promise<AuthUser | null>;
  findUserById: (id: string) => Promise<AuthUser | null>;
  upsertUser: (email: string, passwordHash: string, workspaceIds: readonly string[]) => Promise<AuthUser>;
  createSession: (session: AuthSession) => Promise<void>;
  findActiveSession: (tokenHash: string, now: Date) => Promise<AuthSession | null>;
  deleteSession: (tokenHash: string) => Promise<void>;
}>;

export const createAuthGateway = (): AuthGateway => {
  const users = UserModel as unknown as UserModelDependency;
  const sessions = SessionModel as unknown as SessionModelDependency;
  const mapUser = (user: UserRecord | null): AuthUser | null => user
    ? { id: String(user._id), email: user.email, passwordHash: user.passwordHash, workspaceIds: user.workspaceIds }
    : null;
  return {
    findUserByEmail: async (email) => mapUser(await users.findOne({ email }).lean<UserRecord | null>()),
    findUserById: async (id) => mapUser(await users.findById(id).lean<UserRecord | null>()),
    upsertUser: async (email, passwordHash, workspaceIds) => {
      const user = await users.findOneAndUpdate(
        { email },
        { $set: { email, passwordHash, workspaceIds } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      if (!user) throw new Error("Preview user upsert returned no user.");
      return mapUser(user) as AuthUser;
    },
    createSession: async (session) => { await sessions.create(session); },
    findActiveSession: async (tokenHash, now) =>
      await sessions.findOne({ tokenHash, expiresAt: { $gt: now } }).lean<AuthSession | null>(),
    deleteSession: async (tokenHash) => { await sessions.deleteOne({ tokenHash }); }
  };
};
