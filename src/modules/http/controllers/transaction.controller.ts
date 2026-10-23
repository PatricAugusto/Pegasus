import { Request, Response } from 'express';
import { transactionService } from '../../transactions/transaction.service';
import { userService } from '../../users/user.service';
import { clampSafeInteger, sanitizeString } from '../../../common/sanitizer';

export class TransactionController {
  async list(req: Request, res: Response) {
    try {
      const rawTelegramId = typeof req.query.telegramId === 'string' ? req.query.telegramId : undefined;
      const telegramId = rawTelegramId ? sanitizeString(rawTelegramId, 64) : undefined;

      const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
      const limit = clampSafeInteger(rawLimit, 1, 100, 20);

      let userId: string | undefined = undefined;
      if (telegramId) {
        const user = await userService.findByTelegramId(telegramId);
        if (!user) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        userId = user.id;
      }

      const transactions = await transactionService.getRecent(userId, limit);
      res.json(transactions);
    } catch {
      res.status(500).json({ error: 'Erro ao listar transações' });
    }
  }

  async summary(req: Request, res: Response) {
    try {
      const telegramId = sanitizeString(String(req.params.telegramId), 64);
      const user = await userService.findByTelegramId(telegramId);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const balance = await transactionService.getBalance(user.id);
      const categorySummary = await transactionService.getMonthlySummaryByCategory(user.id);
      const recent = await transactionService.getRecent(user.id, 5);

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
    } catch {
      res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
    }
  }
}

export const transactionController = new TransactionController();
