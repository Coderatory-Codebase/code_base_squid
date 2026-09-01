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

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthErrorBody {
  error: {
    message: string;
    code: string;
  };
}
