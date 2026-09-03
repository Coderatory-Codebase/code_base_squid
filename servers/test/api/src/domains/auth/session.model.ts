import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      required: false,
      trim: true,
      maxlength: 300,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type SessionDocument = HydratedDocument<InferSchemaType<typeof sessionSchema>>;

export const Session = model("Session", sessionSchema);
