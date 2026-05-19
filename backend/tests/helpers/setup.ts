import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';

let mongoServer: MongoMemoryServer;

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/utils/image', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/image')>('../../src/utils/image');
  return {
    ...actual,
    compressImage: vi.fn(async (buffer: Buffer, filename: string) => ({
      buffer,
      contentType: 'image/webp',
      filename: `${filename.replace(/\.[^.]+$/, '')}.webp`,
    })),
  };
});

vi.mock('../../src/gridfs', async () => {
  const actual = await vi.importActual<typeof import('../../src/gridfs')>('../../src/gridfs');
  const files = new Map<string, Buffer>();
  return {
    ...actual,
    uploadBufferToGridFS: vi.fn(async (buffer: Buffer) => {
      const id = new mongoose.Types.ObjectId();
      files.set(id.toString(), buffer);
      return id;
    }),
    getBucket: vi.fn(() => ({
      find: ({ _id }: { _id: mongoose.Types.ObjectId }) => ({
        toArray: async () => (files.has(_id.toString()) ? [{ _id, contentType: 'image/webp' }] : []),
      }),
      openDownloadStream: () => {
        throw new Error('not-implemented-in-tests');
      },
      delete: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret';
  process.env.VAPID_PUBLIC_KEY = 'test-public';
  process.env.VAPID_PRIVATE_KEY = 'test-private';
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

