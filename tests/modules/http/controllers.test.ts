import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/modules/http/app';
import { userService } from '../../../src/modules/users/user.service';
import { transactionService } from '../../../src/modules/transactions/transaction.service';
import { categoryService } from '../../../src/modules/categories/category.service';

vi.mock('../../../src/modules/users/user.service', () => ({
  userService: {
    countUsers: vi.fn(),
    listAllUsers: vi.fn(),
    findByTelegramId: vi.fn(),
  },
}));

vi.mock('../../../src/modules/transactions/transaction.service', () => ({
  transactionService: {
    countTransactions: vi.fn(),
    getRecent: vi.fn(),
    getBalance: vi.fn(),
    getMonthlySummaryByCategory: vi.fn(),
  },
}));

vi.mock('../../../src/modules/categories/category.service', () => ({
  categoryService: {
    getCategoriesForUser: vi.fn(),
  },
}));

describe('Modules: HTTP Controllers & Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('deve retornar status 200 e dados de saúde da aplicação', async () => {
      vi.mocked(userService.countUsers).mockResolvedValue(5);
      vi.mocked(transactionService.countTransactions).mockResolvedValue(42);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database.users).toBe(5);
      expect(res.body.database.transactions).toBe(42);
    });
  });

  describe('GET /api/users', () => {
    it('deve listar usuários cadastrados', async () => {
      const mockUsers = [
        { id: '1', telegramId: '123', firstName: 'Alice' },
        { id: '2', telegramId: '456', firstName: 'Bob' },
      ];
      vi.mocked(userService.listAllUsers).mockResolvedValue(mockUsers as any);

      const res = await request(app).get('/api/users');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].firstName).toBe('Alice');
    });
  });

  describe('GET /api/categories', () => {
    it('deve listar categorias disponíveis', async () => {
      const mockCategories = [
        { id: 'c1', name: 'Alimentação', icon: '🍔' },
        { id: 'c2', name: 'Salário', icon: '💼' },
      ];
      vi.mocked(categoryService.getCategoriesForUser).mockResolvedValue(mockCategories as any);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Alimentação');
    });
  });

  describe('GET /api/transactions', () => {
    it('deve listar transações recentes', async () => {
      const mockTx = [
        { id: 'tx-1', amount: 50, description: 'Mercado' },
      ];
      vi.mocked(transactionService.getRecent).mockResolvedValue(mockTx as any);

      const res = await request(app).get('/api/transactions?limit=5');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].description).toBe('Mercado');
      expect(transactionService.getRecent).toHaveBeenCalledWith(undefined, 5);
    });
  });

  describe('GET /api/summary/:telegramId', () => {
    it('deve retornar resumo completo quando usuário existir', async () => {
      vi.mocked(userService.findByTelegramId).mockResolvedValue({
        id: 'usr-1',
        telegramId: '123456',
        firstName: 'Carlos',
        username: 'carlos',
      } as any);

      vi.mocked(transactionService.getBalance).mockResolvedValue({
        month: 10,
        year: 2026,
        totalIncome: 3000,
        totalExpense: 1000,
        netBalance: 2000,
        transactionCount: 2,
      });

      vi.mocked(transactionService.getMonthlySummaryByCategory).mockResolvedValue({
        totalExpenses: 1000,
        breakdown: [],
      });

      vi.mocked(transactionService.getRecent).mockResolvedValue([]);

      const res = await request(app).get('/api/summary/123456');

      expect(res.status).toBe(200);
      expect(res.body.user.firstName).toBe('Carlos');
      expect(res.body.balance.netBalance).toBe(2000);
    });

    it('deve retornar 404 caso o usuário não seja encontrado', async () => {
      vi.mocked(userService.findByTelegramId).mockResolvedValue(null);

      const res = await request(app).get('/api/summary/999999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Usuário não encontrado');
    });
  });
});
