import { prisma } from '../../db/prisma';

export interface TelegramUserData {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export class UserService {
  async getOrCreateUser(tgUser: TelegramUserData) {
    const telegramId = String(tgUser.id);

    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: tgUser.username || null,
          firstName: tgUser.first_name || null,
          lastName: tgUser.last_name || null,
        },
      });
      console.log(`👤 [User] Novo usuário cadastrado: ${user.firstName || user.username || user.telegramId} (ID: ${user.id})`);
    } else {
      if (
        (tgUser.username && user.username !== tgUser.username) ||
        (tgUser.first_name && user.firstName !== tgUser.first_name) ||
        (tgUser.last_name && user.lastName !== tgUser.last_name)
      ) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            username: tgUser.username || user.username,
            firstName: tgUser.first_name || user.firstName,
            lastName: tgUser.last_name || user.lastName,
          },
        });
      }
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return await prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async listAllUsers() {
    return await prisma.user.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
  }

  async countUsers() {
    return await prisma.user.count();
  }
}

export const userService = new UserService();
