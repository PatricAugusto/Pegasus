import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../src/modules/users/user.service';
import { prisma } from '../../../src/db/prisma';

vi.mock('../../../src/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Modules: UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe('getOrCreateUser', () => {
    it('deve criar um novo usuário quando não encontrado no banco', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'usr-123',
        telegramId: '987654',
        username: 'investidor',
        firstName: 'Carlos',
        lastName: 'Silva',
        currency: 'BRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await service.getOrCreateUser({
        id: 987654,
        username: 'investidor',
        first_name: 'Carlos',
        last_name: 'Silva',
      });

      expect(user.id).toBe('usr-123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          telegramId: '987654',
          username: 'investidor',
          firstName: 'Carlos',
          lastName: 'Silva',
        },
      });
    });

    it('deve atualizar o usuário existente caso dados do Telegram tenham mudado', async () => {
      const existingUser = {
        id: 'usr-123',
        telegramId: '987654',
        username: 'antigo_user',
        firstName: 'Carlos',
        lastName: 'Silva',
        currency: 'BRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...existingUser,
        username: 'novo_user',
      });

      const updated = await service.getOrCreateUser({
        id: 987654,
        username: 'novo_user',
        first_name: 'Carlos',
        last_name: 'Silva',
      });

      expect(updated.username).toBe('novo_user');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-123' },
        data: expect.objectContaining({
          username: 'novo_user',
        }),
      });
    });

    it('não deve disparar update se os dados forem idênticos', async () => {
      const existingUser = {
        id: 'usr-123',
        telegramId: '987654',
        username: 'carlos_silva',
        firstName: 'Carlos',
        lastName: 'Silva',
        currency: 'BRL',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser);

      const user = await service.getOrCreateUser({
        id: 987654,
        username: 'carlos_silva',
        first_name: 'Carlos',
        last_name: 'Silva',
      });

      expect(user.id).toBe('usr-123');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('findByTelegramId', () => {
    it('deve buscar usuário pelo telegramId único', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'usr-1',
        telegramId: '123456',
      } as any);

      const user = await service.findByTelegramId('123456');

      expect(user?.id).toBe('usr-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: '123456' },
      });
    });
  });
});
