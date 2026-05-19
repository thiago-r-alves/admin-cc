import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import type express from 'express';
import { UserModel } from '../../src/models/User';

let cachedApp: express.Express | null = null;

export const loadApp = async (): Promise<express.Express> => {
  if (!cachedApp) {
    const mod = await import('../../src/server');
    cachedApp = mod.app;
  }

  for (let i = 0; i < 50; i += 1) {
    if (mongoose.connection.readyState === 1) return cachedApp;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('MongoDB não conectou a tempo para testes.');
};

export const ensureUsers = async () => {
  const admin = await UserModel.create({ username: 'admin-test', password: '123', role: 'admin' });
  const driver = await UserModel.create({ username: 'driver-test', password: '123', role: 'motorista' });
  return { admin, driver };
};

export const signToken = (userId: string, role: 'admin' | 'motorista') =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

