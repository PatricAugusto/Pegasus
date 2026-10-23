import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from '../db/prisma';
import { getBalance, getMonthlySummaryByCategory, getRecentTransactions } from '../services/transaction.service';
import { getCategoriesForUser } from '../services/category.service';
import { webhookCallback } from 'grammy';
import { bot } from '../bot/bot';
import { env } from '../config/env';

export const app = express();

app.use(cors());
app.use(express.json());

// Rota de Healthcheck
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const transactionCount = await prisma.transaction.count();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        users: userCount,
        transactions: transactionCount,
      },
      bot: {
        configured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_TOKEN !== 'SEU_TOKEN_AQUI'),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});

// Listar Usuários
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Buscar resumo financeiro por telegramId
app.get('/api/summary/:telegramId', async (req: Request, res: Response) => {
  try {
    const telegramId = String(req.params.telegramId);
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const balance = await getBalance(user.id);
    const categorySummary = await getMonthlySummaryByCategory(user.id);
    const recent = await getRecentTransactions(user.id, 5);

    res.json({
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
      },
      balance,
      categorySummary,
      recentTransactions: recent,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
  }
});

// Listar Transações
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const telegramId = typeof req.query.telegramId === 'string' ? req.query.telegramId : undefined;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

    let userId: string | undefined = undefined;
    if (telegramId) {
      const user = await prisma.user.findUnique({ where: { telegramId } });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      userId = user.id;
    }

    const transactions = await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        user: {
          select: { telegramId: true, firstName: true, username: true },
        },
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Listar Categorias
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await getCategoriesForUser();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Webhook do Telegram (usado se configurado em produção)
if (env.WEBHOOK_URL) {
  app.use('/webhook', webhookCallback(bot, 'express'));
  console.log(`📡 [Telegram] Webhook configurado no endpoint /webhook`);
}
