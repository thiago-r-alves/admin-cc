import cors from 'cors';
import express from 'express';
import { authRouter } from '../domains/auth/routes';
import { billingRouter } from '../domains/billing/routes';
import { cacambasRouter } from '../domains/cacambas/routes';
import { citiesRouter } from '../domains/cities/routes';
import { clientsRouter } from '../domains/clients/routes';
import { closuresRouter } from '../domains/closures/routes';
import { driversRouter } from '../domains/drivers/routes';
import { filesRouter } from '../domains/files/routes';
import { ordersRouter } from '../domains/orders/routes';
import { pushRouter } from '../domains/push/routes';

export const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cors());

  app.use(authRouter);
  app.use(ordersRouter);
  app.use(citiesRouter);
  app.use(billingRouter);
  app.use(clientsRouter);
  app.use(driversRouter);
  app.use(cacambasRouter);
  app.use(closuresRouter);
  app.use(filesRouter);
  app.use(pushRouter);

  return app;
};
