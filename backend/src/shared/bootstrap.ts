import dotenv from 'dotenv';
import mongoose from 'mongoose';
import webpush from 'web-push';
import connectDB from '../db';
import '../gridfs';

dotenv.config();

let connectionPromise: Promise<void> | null = null;
let vapidConfigured = false;

const ensurePushSetup = () => {
  if (vapidConfigured) return;
  vapidConfigured = true;

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('Chaves VAPID ausentes. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.');
    return;
  }

  webpush.setVapidDetails(
    'mailto:thiago.ralves02@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
};

export const bootstrapEnvironment = () => {
  ensurePushSetup();

  if (!connectionPromise && mongoose.connection.readyState === 0) {
    connectionPromise = connectDB();
  }

  return connectionPromise;
};
