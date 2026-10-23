import { prisma } from '../../db/prisma';
import { categoryService } from '../categories/category.service';
import { sanitizeString } from '../../common/sanitizer';
import { AppError } from '../../common/errors';
import {
  BalanceResult,
  CreateTransactionDTO,
  MonthlyCategorySummary,
} from './transaction.types';

export class TransactionService {
  async create(dto: CreateTransactionDTO) {
    const rawAmount = typeof dto.amount === 'number' ? dto.amount : parseFloat(String(dto.amount));
    const amount = Math.abs(rawAmount);

    if (isNaN(amount) || !isFinite(amount) || amount === 0) {
      throw new AppError('O valor da transação deve ser um número positivo válido maior que zero');
    }

    if (amount > 1_000_000_000) {
      throw new AppError('O valor da transação excede o limite máximo permitido (R$ 1.000.000.000,00)');
    }

    const cleanDescription = sanitizeString(dto.description, 255);
    if (!cleanDescription) {
      throw new AppError('A descrição da transação não pode ser vazia');
    }

    let categoryId: string | null = null;

    if (dto.categoryName) {
      const cleanCategoryName = sanitizeString(dto.categoryName, 64);
      const category = await categoryService.findByName(cleanCategoryName, dto.userId);
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
        amount: Math.round(amount * 100) / 100, // Arredonda para 2 casas decimais (precisão monetária)
        type: dto.type,
        description: cleanDescription,
        categoryId,
        paymentMethod: dto.paymentMethod ? sanitizeString(dto.paymentMethod, 32) : 'PIX',
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

    // Normaliza para evitar dízimas periódicas de ponto flutuante em JS
    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const netBalance = Math.round((totalIncome - totalExpense) * 100) / 100;

    return {
      month: targetMonth + 1,
      year: targetYear,
      totalIncome,
      totalExpense,
      netBalance,
      transactionCount: transactions.length,
    };
  }

  async getRecent(userId?: string, limit: number = 10) {
    const safeLimit = Math.min(Math.max(1, limit), 100);

    return await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { date: 'desc' },
      take: safeLimit,
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

    totalExpenses = Math.round(totalExpenses * 100) / 100;

    const breakdown = Array.from(categoryMap.values())
      .map((item) => ({
        ...item,
        total: Math.round(item.total * 100) / 100,
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
