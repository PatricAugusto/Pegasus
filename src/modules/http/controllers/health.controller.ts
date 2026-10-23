import { Request, Response } from 'express';
import { userService } from '../../users/user.service';
import { transactionService } from '../../transactions/transaction.service';
import { env } from '../../../config/env';

export class HealthController {
  async check(_req: Request, res: Response) {
    try {
      const userCount = await userService.countUsers();
      const transactionCount = await transactionService.countTransactions();

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
  }
}

export const healthController = new HealthController();
