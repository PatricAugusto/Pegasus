import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ [SQLite] Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ [SQLite] Erro ao conectar com o banco de dados:', error);
    throw error;
  }
}
