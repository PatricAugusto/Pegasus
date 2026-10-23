import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN é obrigatório no .env'),
  WEBHOOK_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.warn('⚠️ [AVISO] Algumas variáveis de ambiente não foram configuradas ou são inválidas:');
  console.warn(JSON.stringify(_env.error.format(), null, 2));
}

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  isProduction: process.env.NODE_ENV === 'production',
};
