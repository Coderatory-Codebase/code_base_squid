import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDatabase(uri: string = env.mongoUri): Promise<typeof mongoose> {
  return mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
