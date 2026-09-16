export interface MongoClient {
  connect: (uri: string, options: Readonly<{ serverSelectionTimeoutMS: number }>) => Promise<unknown>;
  disconnect: () => Promise<void>;
}

export type MongoConnection = Readonly<{
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}>;
