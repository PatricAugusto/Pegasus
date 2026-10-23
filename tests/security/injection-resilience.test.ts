import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from '../../src/modules/transactions/transaction.service';
import { prisma } from '../../src/db/prisma';
import { AppError } from '../../src/common/errors';

vi.mock('../../src/db/prisma', () => ({
  prisma: {
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Security Suite: Injection Resilience & Boundaries', () => {
  let service: TransactionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TransactionService();
  });

  describe('SQL Injection & Prompt Injection Defense', () => {
    it('deve aceitar e sanitizar strings contendo tentativas de SQL Injection sem quebrar', async () => {
      const sqlInjectionDesc = "Almoço'; DROP TABLE Transaction; --";
      vi.mocked(prisma.transaction.create).mockImplementation(async (args: any) => ({
        id: 'tx-safe',
        ...args.data,
      }));

      const tx = await service.create({
        userId: 'user-safe',
        amount: 50.0,
        type: 'EXPENSE',
        description: sqlInjectionDesc,
      });

      // Garante que o texto foi tratado como valor literal e não quebrou a query
      expect(tx.description).toBe("Almoço'; DROP TABLE Transaction; --");
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('deve aceitar textos com tags HTML ou injeções de script sem executar código', async () => {
      const xssDesc = '<script>alert("hack")</script> Compra';
      vi.mocked(prisma.transaction.create).mockImplementation(async (args: any) => ({
        id: 'tx-xss',
        ...args.data,
      }));

      const tx = await service.create({
        userId: 'user-safe',
        amount: 25.0,
        type: 'EXPENSE',
        description: xssDesc,
      });

      expect(tx.description).toBe('<script>alert("hack")</script> Compra');
    });
  });

  describe('Boundary & Numeric Validation', () => {
    it('deve rejeitar valores de transação zerados com AppError', async () => {
      await expect(
        service.create({
          userId: 'usr-1',
          amount: 0,
          type: 'EXPENSE',
          description: 'Café',
        })
      ).rejects.toThrow('O valor da transação deve ser um número positivo válido maior que zero');
    });

    it('deve rejeitar valores que excedem 1 bilhão de reais', async () => {
      await expect(
        service.create({
          userId: 'usr-1',
          amount: 1_000_000_001,
          type: 'INCOME',
          description: 'Mega Sena',
        })
      ).rejects.toThrow('O valor da transação excede o limite máximo permitido');
    });

    it('deve rejeitar valores NaN ou Infinity', async () => {
      await expect(
        service.create({
          userId: 'usr-1',
          amount: NaN,
          type: 'EXPENSE',
          description: 'Valor Inválido',
        })
      ).rejects.toThrow(AppError);

      await expect(
        service.create({
          userId: 'usr-1',
          amount: Infinity,
          type: 'EXPENSE',
          description: 'Valor Infinito',
        })
      ).rejects.toThrow(AppError);
    });

    it('deve rejeitar descrições que fiquem vazias após sanitização', async () => {
      await expect(
        service.create({
          userId: 'usr-1',
          amount: 10,
          type: 'EXPENSE',
          description: '   \x00\x08   ',
        })
      ).rejects.toThrow('A descrição da transação não pode ser vazia');
    });

    it('deve arredondar centavos para evitar discrepâncias de precisão de ponto flutuante em JS', async () => {
      vi.mocked(prisma.transaction.create).mockImplementation(async (args: any) => ({
        id: 'tx-precision',
        ...args.data,
      }));

      const tx = await service.create({
        userId: 'usr-1',
        amount: 19.99999,
        type: 'EXPENSE',
        description: 'Assinatura',
      });

      expect(tx.amount).toBe(20.0);
    });
  });
});
