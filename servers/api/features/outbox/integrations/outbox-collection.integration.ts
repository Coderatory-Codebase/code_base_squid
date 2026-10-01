import mongoose, { type Model } from "mongoose";

export type OutboxStatus = "pending" | "published";

export type OutboxRow = Readonly<{
  id: string;
  topic: string;
  payload: unknown;
  createdAt: number;
}>;

export type OutboxCollection = Readonly<{
  findPending: (options: { limit: number }) => Promise<readonly OutboxRow[]>;
  markPublished: (options: { ids: readonly string[]; publishedAt: number }) => Promise<void>;
}>;

type OutboxDocument = {
  _id: string;
  topic: string;
  payload: unknown;
  status: OutboxStatus;
  createdAt: number;
  publishedAt?: number;
};

export type OutboxModel = Pick<Model<OutboxDocument>, "find" | "updateMany">;

const outboxModelName = "Outbox";

const outboxSchema = new mongoose.Schema<OutboxDocument>({
  _id: { type: String, required: true },
  topic: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["pending", "published"], required: true, default: "pending" },
  createdAt: { type: Number, required: true },
  publishedAt: { type: Number }
}, { _id: false, versionKey: false });

// Row ids are ULIDs, so ascending _id is creation order; this index serves the relay's read.
outboxSchema.index({ status: 1, _id: 1 });

const getOutboxModel = (): Model<OutboxDocument> =>
  (mongoose.models[outboxModelName] as Model<OutboxDocument> | undefined)
    ?? mongoose.model<OutboxDocument>(outboxModelName, outboxSchema);

type OutboxCollectionDependencies = Readonly<{ model?: OutboxModel }>;

export const createMongooseOutboxCollection = ({
  model = getOutboxModel()
}: OutboxCollectionDependencies = {}): OutboxCollection => Object.freeze({
  findPending: async ({ limit }) => {
    const documents = await model
      .find({ status: "pending" })
      .sort({ _id: 1 })
      .limit(limit)
      .lean<OutboxDocument[]>();
    return documents.map((document): OutboxRow => ({
      id: document._id,
      topic: document.topic,
      payload: document.payload,
      createdAt: document.createdAt
    }));
  },
  markPublished: async ({ ids, publishedAt }) => {
    await model.updateMany(
      { _id: { $in: [...ids] } },
      { $set: { status: "published", publishedAt } }
    );
  }
});
