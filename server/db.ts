import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  // Set bufferCommands to false to fail fast instead of hanging when disconnected
  mongoose.set('bufferCommands', false);

  const customUri = process.env.MONGO_URI;

  if (customUri && customUri.trim() !== '') {
    try {
      console.log(`[DB] Attempting connection to specified MONGO_URI...`);
      await mongoose.connect(customUri);
      console.log(`[DB] Connected successfully to custom MongoDB cluster.`);
      return;
    } catch (err) {
      console.error(`[DB] Failed to connect to custom MONGO_URI:`, err);
      console.log(`[DB] Falling back to high-performance embedded MongoDB instance...`);
    }
  }

  try {
    console.log(`[DB] Initializing embedded MongoDB server...`);
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri, {
      dbName: 'biztrack',
    });
    console.log(`[DB] Embedded MongoDB connected successfully at ${uri}`);
  } catch (error) {
    console.warn(`[DB] Embedded MongoDB not available — running with offline fallback:`, error);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
