import { prisma } from '../db/prisma';

export const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: '🍔', type: 'EXPENSE', color: '#FF7043' },
  { name: 'Transporte', icon: '🚗', type: 'EXPENSE', color: '#42A5F5' },
  { name: 'Moradia', icon: '🏠', type: 'EXPENSE', color: '#AB47BC' },
  { name: 'Lazer', icon: '🎉', type: 'EXPENSE', color: '#FFA726' },
  { name: 'Saúde', icon: '💊', type: 'EXPENSE', color: '#EF5350' },
  { name: 'Educação', icon: '📚', type: 'EXPENSE', color: '#26A69A' },
  { name: 'Compras', icon: '🛍️', type: 'EXPENSE', color: '#EC407A' },
  { name: 'Contas & Serviços', icon: '📄', type: 'EXPENSE', color: '#78909C' },
  { name: 'Salário', icon: '💼', type: 'INCOME', color: '#66BB6A' },
  { name: 'Investimentos', icon: '📈', type: 'INCOME', color: '#2E7D32' },
  { name: 'Renda Extra', icon: '💰', type: 'INCOME', color: '#81C784' },
  { name: 'Outros', icon: '📦', type: 'EXPENSE', color: '#BDBDBD' },
];

export async function seedDefaultCategories() {
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

export async function getCategoriesForUser(userId?: string) {
  return await prisma.category.findMany({
    where: {
      OR: [
        { userId: null }, // Categorias globais do sistema
        ...(userId ? [{ userId }] : []), // Categorias customizadas do usuário
      ],
    },
    orderBy: { name: 'asc' },
  });
}

export async function findCategoryByName(name: string, userId?: string) {
  const normalized = name.trim().toLowerCase();
  const categories = await getCategoriesForUser(userId);

  return categories.find((c) => c.name.toLowerCase() === normalized) || null;
}

export async function findOrCreateCategory(name: string, type: 'EXPENSE' | 'INCOME', userId: string) {
  const existing = await findCategoryByName(name, userId);
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
