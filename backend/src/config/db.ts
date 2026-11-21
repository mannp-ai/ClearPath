import mongoose from 'mongoose';

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed', err);
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw err;
  }
}
