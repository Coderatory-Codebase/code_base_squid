import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

const noteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    body: {
      type: String,
      required: false,
      trim: true,
      maxlength: 20000,
      default: "",
    },
  },
  { timestamps: true },
);

export type NoteDocument = HydratedDocument<InferSchemaType<typeof noteSchema>>;

export const Note = model("Note", noteSchema);
