import mongoose, { type Model } from "mongoose";

export type OutboxLease = Readonly<{
  // Takes the lease, or renews it when this owner already holds it. Resolves false while another owner's lease is live.
  acquire: (options: { ownerId: string; ttlMs: number; now: number }) => Promise<boolean>;
  // Gives the lease up immediately so a successor does not have to wait for it to expire. Only the holder can release it.
  release: (options: { ownerId: string }) => Promise<void>;
}>;

type OutboxLeaseDocument = {
  _id: string;
  ownerId: string;
  expiresAt: number;
};

export type OutboxLeaseModel = Pick<Model<OutboxLeaseDocument>, "findOneAndUpdate" | "deleteOne">;

const outboxLeaseModelName = "OutboxLease";
const duplicateKeyErrorCode = 11_000;

const outboxLeaseSchema = new mongoose.Schema<OutboxLeaseDocument>({
  _id: { type: String, required: true },
  ownerId: { type: String, required: true },
  expiresAt: { type: Number, required: true }
}, { _id: false, versionKey: false, collection: "outbox_leases" });

const getOutboxLeaseModel = (): Model<OutboxLeaseDocument> =>
  (mongoose.models[outboxLeaseModelName] as Model<OutboxLeaseDocument> | undefined)
    ?? mongoose.model<OutboxLeaseDocument>(outboxLeaseModelName, outboxLeaseSchema);

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: unknown }).code === duplicateKeyErrorCode;

type OutboxLeaseDependencies = Readonly<{
  leaseName: string;
  model?: OutboxLeaseModel;
}>;

// The lease is one document keyed by name. The conditional upsert matches only when this owner already holds it or it has
// expired. Otherwise the upsert tries to insert the same _id, and the unique _id index rejects it, which means "held elsewhere".
export const createMongooseOutboxLease = ({
  leaseName,
  model = getOutboxLeaseModel()
}: OutboxLeaseDependencies): OutboxLease => Object.freeze({
  acquire: async ({ ownerId, ttlMs, now }) => {
    try {
      const document = await model.findOneAndUpdate(
        { _id: leaseName, $or: [{ ownerId }, { expiresAt: { $lte: now } }] },
        { $set: { ownerId, expiresAt: now + ttlMs } },
        { upsert: true, returnDocument: "after" }
      ).lean<OutboxLeaseDocument | null>();
      return document?.ownerId === ownerId;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
  },
  release: async ({ ownerId }) => {
    await model.deleteOne({ _id: leaseName, ownerId });
  }
});
