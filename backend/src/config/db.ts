import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache || { conn: null, promise: null };
if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

export function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

export async function connectDB(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI must be configured');

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 2 && cached.promise) {
    return cached.promise;
  }

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
    dbName: process.env.MONGODB_DATABASE || undefined,
  };

  cached.promise = mongoose.connect(uri, options).then((m) => {
    cached.conn = m;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Connected to MongoDB: ${maskMongoUri(uri)}`);
    }
    return m;
  }).catch((err) => {
    cached.promise = null;
    cached.conn = null;
    if (process.env.NODE_ENV !== 'test') {
      console.error(`MongoDB connection failed: ${err.message}`);
    }
    throw err;
  });

  return cached.promise;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cached.conn = null;
  cached.promise = null;
}

export async function ensureIndexes(): Promise<void> {
  try {
    const models = mongoose.modelNames();
    for (const name of models) {
      await mongoose.model(name).syncIndexes();
    }
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Index synchronization notice:', err?.message || err);
    }
  }
}
