import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from '../../../src/modules/transactions/transaction.service';
import { prisma } from '../../../src/db/prisma';
import { categoryService } from '../../../src/modules/categories/category.service';

vi.mock('../../../src/db/prisma', () => ({
  prisma: {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../src/modules/categories/category.service', () => ({
  categoryService: {
    findByName: vi.fn(),
    getDefaultOtherCategory: vi.fn(),
  },
}));

describe('Modules: TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransactionService();
  });

  describe('create', () => {
    it('deve converter valores negativos para positivos com Math.abs', async () => {
      vi.mocked(categoryService.findByName).mockResolvedValue({ id: 'cat-transp', name: 'Transporte' } as any);
      vi.mocked(prisma.transaction.create).mockImplementation(async (args: any) => ({
        id: 'tx-1',
        ...args.data,
      }));

      const tx = await service.create({
        userId: 'user-1',
        amount: -45.5,
        type: 'EXPENSE',
        description: 'Uber',
        categoryName: 'Transporte',
      });

      expect(tx.amount).toBe(45.5);
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 45.5,
            type: 'EXPENSE',
            description: 'Uber',
            categoryId: 'cat-transp',
          }),
        })
      );
    });

    it('deve associar com categoria Outros caso despesa não tenha categoria definida', async () => {
      vi.mocked(categoryService.findByName).mockResolvedValue(null);
      vi.mocked(categoryService.getDefaultOtherCategory).mockResolvedValue({ id: 'cat-outros', name: 'Outros' } as any);
      vi.mocked(prisma.transaction.create).mockImplementation(async (args: any) => ({
        id: 'tx-2',
        ...args.data,
      }));

      await service.create({
        userId: 'user-1',
        amount: 20,
        type: 'EXPENSE',
        description: 'Lanche rápido',
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categoryId: 'cat-outros',
          }),
        })
      );
    });
  });

  describe('getBalance', () => {
    it('deve calcular corretamente receitas, despesas e saldo líquido', async () => {
      const mockTransactions = [
        { id: '1', amount: 3000, type: 'INCOME' },
        { id: '2', amount: 500, type: 'INCOME' },
        { id: '3', amount: 1200, type: 'EXPENSE' },
        { id: '4', amount: 300, type: 'EXPENSE' },
      ];

      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions as any);

      const balance = await service.getBalance('user-1', 9, 2026);

      expect(balance.totalIncome).toBe(3500);
      expect(balance.totalExpense).toBe(1500);
      expect(balance.netBalance).toBe(2000); // 3500 - 1500
      expect(balance.transactionCount).toBe(4);
      expect(balance.month).toBe(10);
      expect(balance.year).toBe(2026);
    });

    it('deve lidar com ausência de transações retornando zeros', async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);

      const balance = await service.getBalance('user-1', 0, 2026);

      expect(balance.totalIncome).toBe(0);
      expect(balance.totalExpense).toBe(0);
      expect(balance.netBalance).toBe(0);
      expect(balance.transactionCount).toBe(0);
    });
  });

  describe('getMonthlySummaryByCategory', () => {
    it('deve agrupar por categoria, calcular percentual e ordenar pela maior despesa', async () => {
      const mockTransactions = [
        { amount: 500, category: { name: 'Alimentação', icon: '🍔' } },
        { amount: 300, category: { name: 'Alimentação', icon: '🍔' } }, // Total 800 (80%)
        { amount: 200, category: { name: 'Transporte', icon: '🚗' } },  // Total 200 (20%)
      ];

      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTransactions as any);

      const summary = await service.getMonthlySummaryByCategory('user-1', 9, 2026);

      expect(summary.totalExpenses).toBe(1000);
      expect(summary.breakdown).toHaveLength(2);

      // Maior despesa primeiro
      expect(summary.breakdown[0].name).toBe('Alimentação');
      expect(summary.breakdown[0].total).toBe(800);
      expect(summary.breakdown[0].percentage).toBe(80);
      expect(summary.breakdown[0].count).toBe(2);

      // Segunda maior despesa
      expect(summary.breakdown[1].name).toBe('Transporte');
      expect(summary.breakdown[1].total).toBe(200);
      expect(summary.breakdown[1].percentage).toBe(20);
      expect(summary.breakdown[1].count).toBe(1);
    });
  });
});
