import { Schema, model } from "../../../integrations/mongodb/index.js";

export type WorkspaceMember = Readonly<{
  userId: string;
  role: string;
  guest: boolean;
  joinedAt: Date;
}>;

export type WorkspaceNotAppliedEvent = Readonly<{
  eventId: string;
  reason: "ARCHIVED";
  recordedAt: Date;
}>;

export interface WorkspaceRecord {
  readonly _id: string;
  readonly status: "ACTIVE" | "ARCHIVED";
  readonly defaultRole: string;
  readonly members: readonly WorkspaceMember[];
  readonly appliedEventIds: readonly string[];
  readonly notAppliedEvents: readonly WorkspaceNotAppliedEvent[];
}

interface WorkspaceDocument extends WorkspaceRecord {
  _id: string;
}

const workspaceMemberSchema = new Schema<WorkspaceMember>({
  userId: { type: String, required: true },
  role: { type: String, required: true },
  guest: { type: Boolean, required: true, default: false },
  joinedAt: { type: Date, required: true }
}, { _id: false });

const notAppliedEventSchema = new Schema<WorkspaceNotAppliedEvent>({
  eventId: { type: String, required: true },
  reason: { type: String, enum: ["ARCHIVED"], required: true },
  recordedAt: { type: Date, required: true }
}, { _id: false });

const workspaceSchema = new Schema<WorkspaceDocument>({
  _id: { type: String, required: true },
  status: { type: String, enum: ["ACTIVE", "ARCHIVED"], required: true, default: "ACTIVE" },
  defaultRole: { type: String, required: true, trim: true, default: "member" },
  members: { type: [workspaceMemberSchema], required: true, default: [] },
  appliedEventIds: { type: [String], required: true, default: [] },
  notAppliedEvents: { type: [notAppliedEventSchema], required: true, default: [] }
}, { timestamps: true, versionKey: false, collection: "workspaces" });

export const WorkspaceModel = model<WorkspaceDocument>("Workspace", workspaceSchema);
