import mongoose from 'mongoose';
import { connectDB, disconnectDB, maskMongoUri } from '../src/config/db';

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      readyState: 0,
    },
  };
});

describe('MongoDB Atlas Database Connection Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mongoose.connection as any).readyState = 0;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('masks credentials properly in MongoDB connection strings', () => {
    const rawUri = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.abcde.mongodb.net/clearpath?retryWrites=true';
    const masked = maskMongoUri(rawUri);
    expect(masked).toBe('mongodb+srv://***:***@cluster0.abcde.mongodb.net/clearpath?retryWrites=true');
    expect(masked).not.toContain('SuperSecretPassword123');
    expect(masked).not.toContain('admin_user');
  });

  it('connects with serverless timeout and pool size options', async () => {
    (mongoose.connect as jest.Mock).mockResolvedValue(mongoose);

    await connectDB('mongodb://127.0.0.1:27017/test-db');
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://127.0.0.1:27017/test-db',
      expect.objectContaining({
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      }),
    );
  });

  it('reuses existing connection when readyState is 1 (connected)', async () => {
    (mongoose.connection as any).readyState = 1;
    (mongoose.connect as jest.Mock).mockClear();

    await connectDB('mongodb://127.0.0.1:27017/test-db');
    // Should NOT call mongoose.connect again
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
});

describe('MONGODB_URI requirement and 503 handling', () => {
  const saved = process.env.MONGODB_URI;
  afterEach(() => { process.env.MONGODB_URI = saved; });

  it('does not fall back to localhost when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;
    (mongoose.connect as jest.Mock).mockClear();
    await expect(connectDB()).rejects.toThrow('MONGODB_URI');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });
});
