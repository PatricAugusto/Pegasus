import { prisma } from '../../db/prisma';
import { categoryService } from '../categories/category.service';
import {
  BalanceResult,
  CreateTransactionDTO,
  MonthlyCategorySummary,
} from './transaction.types';

export class TransactionService {
  async create(dto: CreateTransactionDTO) {
    let categoryId: string | null = null;

    if (dto.categoryName) {
      const category = await categoryService.findByName(dto.categoryName, dto.userId);
      if (category) {
        categoryId = category.id;
      }
    }

    // Se for despesa e não tiver categoria, vincula a 'Outros' por padrão
    if (!categoryId && dto.type === 'EXPENSE') {
      const defaultOther = await categoryService.getDefaultOtherCategory();
      if (defaultOther) categoryId = defaultOther.id;
    }

    return await prisma.transaction.create({
      data: {
        userId: dto.userId,
        amount: Math.abs(dto.amount),
        type: dto.type,
        description: dto.description.trim(),
        categoryId,
        paymentMethod: dto.paymentMethod || 'PIX',
        source: dto.source || 'COMMAND',
        date: dto.date || new Date(),
      },
      include: {
        category: true,
      },
    });
  }

  async getBalance(userId: string, month?: number, year?: number): Promise<BalanceResult> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    }

    return {
      month: targetMonth + 1,
      year: targetYear,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }

  async getRecent(userId?: string, limit: number = 10) {
    return await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        category: true,
        user: {
          select: { telegramId: true, firstName: true, username: true },
        },
      },
    });
  }

  async getMonthlySummaryByCategory(userId: string, month?: number, year?: number): Promise<MonthlyCategorySummary> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    });

    const categoryMap = new Map<string, { name: string; icon: string; total: number; count: number }>();
    let totalExpenses = 0;

    for (const t of transactions) {
      const catName = t.category?.name || 'Sem Categoria';
      const catIcon = t.category?.icon || '📦';
      totalExpenses += t.amount;

      const existing = categoryMap.get(catName) || { name: catName, icon: catIcon, total: 0, count: 0 };
      existing.total += t.amount;
      existing.count += 1;
      categoryMap.set(catName, existing);
    }

    const breakdown = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalExpenses,
      breakdown,
    };
  }

  async countTransactions() {
    return await prisma.transaction.count();
  }
}

export const transactionService = new TransactionService();
