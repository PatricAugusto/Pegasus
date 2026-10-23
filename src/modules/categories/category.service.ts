import { prisma } from '../../db/prisma';
import { DEFAULT_CATEGORIES } from './category.constants';

export class CategoryService {
  async seedDefaultCategories(): Promise<void> {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name, userId: null },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            name: cat.name,
            icon: cat.icon,
            type: cat.type,
            color: cat.color,
            userId: null,
          },
        });
      }
    }
  }

  async getCategoriesForUser(userId?: string) {
    return await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          ...(userId ? [{ userId }] : []),
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string, userId?: string) {
    const normalized = name.trim().toLowerCase();
    const categories = await this.getCategoriesForUser(userId);
    return categories.find((c) => c.name.toLowerCase() === normalized) || null;
  }

  async findOrCreate(name: string, type: 'EXPENSE' | 'INCOME', userId: string) {
    const existing = await this.findByName(name, userId);
    if (existing) return existing;

    return await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        icon: type === 'INCOME' ? '💵' : '🏷️',
        userId,
      },
    });
  }

  async getDefaultOtherCategory() {
    return await prisma.category.findFirst({
      where: { name: 'Outros', userId: null },
    });
  }
}

export const categoryService = new CategoryService();
