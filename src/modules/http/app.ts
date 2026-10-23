import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes';
import { apiRouter } from './routes/api.routes';
import { env } from '../../config/env';
import { webhookCallback } from 'grammy';
import { bot } from '../bot/bot.instance';

export function createExpressApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Rotas
  app.use('/', healthRouter);
  app.use('/api', apiRouter);

  // Webhook se configurado em produção
  if (env.WEBHOOK_URL) {
    app.use('/webhook', webhookCallback(bot, 'express'));
    console.log(`📡 [Telegram] Webhook configurado no endpoint /webhook`);
  }

  return app;
}

export const app = createExpressApp();
