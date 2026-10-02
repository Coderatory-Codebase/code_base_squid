import { Schema, model } from "mongoose";

export interface UserInvitation {
  readonly workspaceId: string;
  readonly email: string;
  readonly invitedBy: string;
  readonly tokenHash: string;
  readonly status: "pending" | "accepted" | "expired" | "revoked";
  readonly role: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly acceptedAt?: Date;
  readonly deletedAt?: Date;
}

interface UserInvitationDocument extends UserInvitation {
  _id: string;
}

const userInvitationSchema = new Schema<UserInvitationDocument>(
  {
    workspaceId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true
    },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date },
    deletedAt: { type: Date, index: true }
  },
  {
    timestamps: true,
    collection: "user_invitations"
  }
);

// Covers the default workspace-scoped listing and its created-at ordering.
userInvitationSchema.index({ workspaceId: 1, deletedAt: 1, createdAt: -1 });
// Covers status-filtered workspace-scoped listings and their ordering.
userInvitationSchema.index({ workspaceId: 1, status: 1, deletedAt: 1, createdAt: -1 });
userInvitationSchema.index(
  { workspaceId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending", deletedAt: null }
  }
);

export const UserInvitationModel = model<UserInvitationDocument>(
  "UserInvitation",
  userInvitationSchema
);
