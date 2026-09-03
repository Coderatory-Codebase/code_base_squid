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

export class IncorrectPasswordError extends Error {
  constructor() {
    super("Current password is incorrect.");
    this.name = "IncorrectPasswordError";
  }
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user.id as string,
    email: user.email,
    displayName: user.displayName ?? null,
    createdAt: (user.createdAt as Date).toISOString(),
  };
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<UserDocument | null> {
  return User.findByIdAndUpdate(
    userId,
    { displayName },
    { returnDocument: "after", runValidators: true },
  );
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

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new InvalidCredentialsError();
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new IncorrectPasswordError();
  }
  user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
  await user.save();
}

export function signAccessToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { sub: userId, sid: sessionId } satisfies AccessTokenPayload,
    env.accessTokenSecret,
    { expiresIn: env.accessTokenTtl },
  );
}

export function signRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign(
    { sub: userId, sid: sessionId } satisfies AccessTokenPayload,
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenTtl },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.accessTokenSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.refreshTokenSecret) as AccessTokenPayload;
}
