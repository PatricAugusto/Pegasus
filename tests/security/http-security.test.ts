import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/modules/http/app';
import { transactionService } from '../../src/modules/transactions/transaction.service';
import { userService } from '../../src/modules/users/user.service';

vi.mock('../../src/modules/transactions/transaction.service', () => ({
  transactionService: {
    getRecent: vi.fn(),
    getBalance: vi.fn(),
    getMonthlySummaryByCategory: vi.fn(),
    countTransactions: vi.fn(),
  },
}));

vi.mock('../../src/modules/users/user.service', () => ({
  userService: {
    findByTelegramId: vi.fn(),
    countUsers: vi.fn(),
    listAllUsers: vi.fn(),
  },
}));

describe('Security Suite: HTTP Security & Headers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Headers (Helmet)', () => {
    it('deve incluir cabeçalho X-Content-Type-Options: nosniff para prevenir MIME sniffing', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve incluir cabeçalho X-Frame-Options: SAMEORIGIN para prevenir Clickjacking', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('deve configurar Content-Security-Policy (CSP) adequadamente', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Query Parameters Protection & DoS Defense', () => {
    it('deve limitar automaticamente o parâmetro ?limit a no máximo 100 itens', async () => {
      vi.mocked(transactionService.getRecent).mockResolvedValue([]);

      await request(app).get('/api/transactions?limit=9999999');

      // Verifica se o controlador clampeou o limit para 100
      expect(transactionService.getRecent).toHaveBeenCalledWith(undefined, 100);
    });

    it('deve limitar automaticamente o parâmetro ?limit negativo para o mínimo de 1 item', async () => {
      vi.mocked(transactionService.getRecent).mockResolvedValue([]);

      await request(app).get('/api/transactions?limit=-50');

      expect(transactionService.getRecent).toHaveBeenCalledWith(undefined, 1);
    });

    it('deve lidar com valores não-numéricos no limit aplicando o padrão seguro (20 itens)', async () => {
      vi.mocked(transactionService.getRecent).mockResolvedValue([]);

      await request(app).get('/api/transactions?limit=abc');

      expect(transactionService.getRecent).toHaveBeenCalledWith(undefined, 20);
    });

    it('deve sanitizar o telegramId contra caracteres de controle', async () => {
      vi.mocked(userService.findByTelegramId).mockResolvedValue(null);

      await request(app).get('/api/summary/123\x00\x08456');

      expect(userService.findByTelegramId).toHaveBeenCalledWith('123456');
    });
  });
});
