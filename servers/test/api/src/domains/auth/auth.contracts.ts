import { z } from "zod";

// Owned by servers/api (contracts.md -> "ownership before reuse") — the
// API is the boundary owner. apps/web defines its own local types for
// what it consumes rather than importing this (ADR-012 -> "Contract
// placement").

export const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const updateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
}

export interface AuthErrorBody {
  error: {
    message: string;
    code: string;
  };
}
