import { Request, Response } from 'express';
import { transactionService } from '../../transactions/transaction.service';
import { userService } from '../../users/user.service';

export class TransactionController {
  async list(req: Request, res: Response) {
    try {
      const telegramId = typeof req.query.telegramId === 'string' ? req.query.telegramId : undefined;
      const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

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
      const telegramId = String(req.params.telegramId);
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
