import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../../../src/modules/categories/category.service';
import { prisma } from '../../../src/db/prisma';

vi.mock('../../../src/db/prisma', () => ({
  prisma: {
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Modules: CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoryService();
  });

  describe('findByName', () => {
    it('deve localizar categoria pelo nome independentemente de maiúsculas/minúsculas', async () => {
      const mockCategories = [
        { id: '1', name: 'Alimentação', icon: '🍔', type: 'EXPENSE', userId: null },
        { id: '2', name: 'Transporte', icon: '🚗', type: 'EXPENSE', userId: null },
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

      const result = await service.findByName('alimentação');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('Alimentação');
    });

    it('deve retornar null quando a categoria não for encontrada', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      const result = await service.findByName('Inexistente');
      expect(result).toBeNull();
    });
  });

  describe('findOrCreate', () => {
    it('deve retornar categoria existente se já cadastrada', async () => {
      const existing = { id: 'cat-1', name: 'Lazer', icon: '🎉', type: 'EXPENSE', userId: null };
      vi.mocked(prisma.category.findMany).mockResolvedValue([existing as any]);

      const result = await service.findOrCreate('Lazer', 'EXPENSE', 'user-1');

      expect(result.id).toBe('cat-1');
      expect(prisma.category.create).not.toHaveBeenCalled();
    });

    it('deve criar uma nova categoria customizada caso não exista', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);
      const newCategory = { id: 'new-cat', name: 'Pets', type: 'EXPENSE', icon: '🏷️', userId: 'user-1' };
      vi.mocked(prisma.category.create).mockResolvedValue(newCategory as any);

      const result = await service.findOrCreate('Pets', 'EXPENSE', 'user-1');

      expect(result.name).toBe('Pets');
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Pets',
          type: 'EXPENSE',
          icon: '🏷️',
          userId: 'user-1',
        },
      });
    });
  });

  describe('seedDefaultCategories', () => {
    it('deve inserir apenas categorias que ainda não existem', async () => {
      // Simula que a primeira categoria já existe, as outras não
      vi.mocked(prisma.category.findFirst)
        .mockResolvedValueOnce({ id: 'exists', name: 'Alimentação' } as any)
        .mockResolvedValue(null);

      await service.seedDefaultCategories();

      // Verifica que findFirst foi chamado para verificar as 12 categorias padrão
      expect(prisma.category.findFirst).toHaveBeenCalled();
      // Deve ter criado 11 categorias novas (1 já existia)
      expect(prisma.category.create).toHaveBeenCalledTimes(11);
    });
  });
});
