import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { User, type UserDocument } from "./user.model.js";
import type { AuthUser } from "./auth.contracts.js";

const PASSWORD_SALT_ROUNDS = 12;

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("Email is already registered.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

export interface AccessTokenPayload {
  sub: string;
}

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user.id as string,
    email: user.email,
    createdAt: (user.createdAt as Date).toISOString(),
  };
}

export async function registerUser(email: string, password: string): Promise<UserDocument> {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new EmailAlreadyRegisteredError();
  }
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  return User.create({ email, passwordHash });
}

export async function verifyCredentials(email: string, password: string): Promise<UserDocument> {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new InvalidCredentialsError();
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }
  return user;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.accessTokenSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.refreshTokenSecret, {
    expiresIn: env.refreshTokenTtl,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.accessTokenSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.refreshTokenSecret) as AccessTokenPayload;
}
