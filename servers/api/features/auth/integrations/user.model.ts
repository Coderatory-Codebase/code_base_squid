import mongoose, { Schema } from "mongoose";

export type UserDocument = Readonly<{
  _id: string;
  email: string;
  passwordHash: string;
  workspaceIds: readonly string[];
}>;

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    workspaceIds: { type: [String], required: true, default: [] }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User ?? mongoose.model<UserDocument>("User", userSchema, "users");
