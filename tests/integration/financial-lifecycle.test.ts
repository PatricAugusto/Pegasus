import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/db/prisma';
import { userService } from '../../src/modules/users/user.service';
import { categoryService } from '../../src/modules/categories/category.service';
import { transactionService } from '../../src/modules/transactions/transaction.service';

describe('Integration Suite: Complete Financial Life-Cycle', () => {
  const TEST_TELEGRAM_ID = 'test_lifecycle_user_' + Date.now();
  let createdUserId: string;

  beforeAll(async () => {
    // 1. Inicializa categorias padrão no SQLite
    await categoryService.seedDefaultCategories();

    // 2. Cria usuário de teste no SQLite real
    const user = await userService.getOrCreateUser({
      id: TEST_TELEGRAM_ID,
      username: 'test_investor',
      first_name: 'Investor',
      last_name: 'Test',
    });
    createdUserId = user.id;
  });

  afterAll(async () => {
    // Limpeza completa pós-teste
    if (createdUserId) {
      await prisma.user.delete({
        where: { id: createdUserId },
      });
    }
    await prisma.$disconnect();
  });

  it('1. Deve registrar uma receita inicial (Salário de R$ 5.000,00)', async () => {
    const income = await transactionService.create({
      userId: createdUserId,
      amount: 5000.0,
      type: 'INCOME',
      description: 'Salário Mensal',
      categoryName: 'Salário',
      paymentMethod: 'TRANSFER',
      source: 'COMMAND',
    });

    expect(income.id).toBeDefined();
    expect(income.amount).toBe(5000.0);
    expect(income.type).toBe('INCOME');
    expect(income.category?.name).toBe('Salário');
  });

  it('2. Deve registrar múltiplas despesas com categorias distintas', async () => {
    const exp1 = await transactionService.create({
      userId: createdUserId,
      amount: 1200.0,
      type: 'EXPENSE',
      description: 'Aluguel do Apartamento',
      categoryName: 'Moradia',
      paymentMethod: 'PIX',
    });

    const exp2 = await transactionService.create({
      userId: createdUserId,
      amount: 600.0,
      type: 'EXPENSE',
      description: 'Compras de Supermercado',
      categoryName: 'Alimentação',
      paymentMethod: 'DEBIT',
    });

    const exp3 = await transactionService.create({
      userId: createdUserId,
      amount: 200.0,
      type: 'EXPENSE',
      description: 'Abastecimento Carro',
      categoryName: 'Transporte',
      paymentMethod: 'CREDIT',
    });

    expect(exp1.amount).toBe(1200.0);
    expect(exp2.amount).toBe(600.0);
    expect(exp3.amount).toBe(200.0);
  });

  it('3. Deve calcular o saldo líquido com precisão matemática absoluta', async () => {
    const balance = await transactionService.getBalance(createdUserId);

    expect(balance.totalIncome).toBe(5000.0);
    expect(balance.totalExpense).toBe(2000.0);
    expect(balance.netBalance).toBe(3000.0); // 5000 - 2000 = 3000
    expect(balance.transactionCount).toBe(4);
  });

  it('4. Deve gerar a distribuição percentual por categoria com ordenação decrescente', async () => {
    const summary = await transactionService.getMonthlySummaryByCategory(createdUserId);

    expect(summary.totalExpenses).toBe(2000.0);
    expect(summary.breakdown).toHaveLength(3);

    // Moradia: 1200 / 2000 = 60%
    expect(summary.breakdown[0].name).toBe('Moradia');
    expect(summary.breakdown[0].total).toBe(1200.0);
    expect(summary.breakdown[0].percentage).toBe(60);

    // Alimentação: 600 / 2000 = 30%
    expect(summary.breakdown[1].name).toBe('Alimentação');
    expect(summary.breakdown[1].total).toBe(600.0);
    expect(summary.breakdown[1].percentage).toBe(30);

    // Transporte: 200 / 2000 = 10%
    expect(summary.breakdown[2].name).toBe('Transporte');
    expect(summary.breakdown[2].total).toBe(200.0);
    expect(summary.breakdown[2].percentage).toBe(10);
  });

  it('5. Deve retornar o histórico recente ordenado por data decrescente', async () => {
    const recent = await transactionService.getRecent(createdUserId, 10);

    expect(recent).toHaveLength(4);
    // Mais recente primeiro
    expect(recent[0].description).toBe('Abastecimento Carro');
    expect(recent[3].description).toBe('Salário Mensal');
  });
});
