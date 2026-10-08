import mongoose, { Schema } from "mongoose";

export type UserDocument = Readonly<{
  _id: string;
  email: string;
  passwordHash: string;
  workspaceIds: readonly string[];
}>;

export const normalizeUserId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  throw new Error("MongoDB returned an invalid user identifier.");
};

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    workspaceIds: { type: [String], required: true, default: [] }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema, "users");
