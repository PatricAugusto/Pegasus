import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function checkDatabaseConsistency(client: PrismaClient = prisma) {
  const integrity = await client.$queryRaw<Array<{ integrity_check: string }>>`PRAGMA integrity_check`;
  const foreignKeyViolations = await client.$queryRaw<
    Array<{ table: string; rowid: bigint | null; parent: string; fkid: number }>
  >`PRAGMA foreign_key_check`;
  const tables = await client.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN ('User', 'Category', 'Transaction', 'Budget')
  `;
  const requiredTables = ['User', 'Category', 'Transaction', 'Budget'];
  const presentTables = new Set(tables.map((table) => table.name));
  const missingTables = requiredTables.filter((table) => !presentTables.has(table));

  return { integrity, foreignKeyViolations, missingTables };
}

export async function assertDatabaseConsistency(client: PrismaClient = prisma): Promise<void> {
  const { integrity, foreignKeyViolations, missingTables } = await checkDatabaseConsistency(client);
  const integrityErrors = integrity.filter((result) => result.integrity_check !== 'ok');

  if (integrityErrors.length > 0 || foreignKeyViolations.length > 0 || missingTables.length > 0) {
    const problems = [
      ...integrityErrors.map((result) => `integrity_check: ${result.integrity_check}`),
      ...foreignKeyViolations.map(
        (violation) => `foreign_key_check: ${violation.table} row ${violation.rowid ?? 'unknown'}`,
      ),
      ...(missingTables.length > 0 ? [`missing tables: ${missingTables.join(', ')}`] : []),
    ];
    throw new Error(`SQLite consistency check failed: ${problems.join('; ')}.`);
  }
}

export async function connectDB() {
  try {
    await prisma.$connect();
    await assertDatabaseConsistency();
    console.log('✅ [SQLite] Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ [SQLite] Erro ao conectar com o banco de dados:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}
