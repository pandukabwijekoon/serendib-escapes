import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";

mongoose.set("sanitizeFilter", true);
mongoose.set("strictQuery", true);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  __mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { MONGODB_URI } = getServerEnv();
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
