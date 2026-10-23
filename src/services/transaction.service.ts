import { prisma } from '../db/prisma';
import { findCategoryByName } from './category.service';

export interface CreateTransactionDTO {
  userId: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  categoryName?: string;
  paymentMethod?: string;
  date?: Date;
  source?: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export async function createTransaction(dto: CreateTransactionDTO) {
  let categoryId: string | null = null;

  if (dto.categoryName) {
    const category = await findCategoryByName(dto.categoryName, dto.userId);
    if (category) {
      categoryId = category.id;
    }
  }

  // Se for despesa e não tiver categoria, associar com Outros por padrão
  if (!categoryId && dto.type === 'EXPENSE') {
    const defaultOther = await prisma.category.findFirst({
      where: { name: 'Outros', userId: null },
    });
    if (defaultOther) categoryId = defaultOther.id;
  }

  const transaction = await prisma.transaction.create({
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

  return transaction;
}

export async function getBalance(userId: string, month?: number, year?: number) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth(); // 0-indexed no JS

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
    include: {
      category: true,
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

  const netBalance = totalIncome - totalExpense;

  return {
    month: targetMonth + 1,
    year: targetYear,
    totalIncome,
    totalExpense,
    netBalance,
    transactionCount: transactions.length,
  };
}

export async function getRecentTransactions(userId: string, limit: number = 10) {
  return await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      category: true,
    },
  });
}

export async function getMonthlySummaryByCategory(userId: string, month?: number, year?: number) {
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
