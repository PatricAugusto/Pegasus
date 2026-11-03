import 'dotenv/config';
import { access, copyFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { assertDatabaseConsistency, prisma } from '../src/db/prisma';

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolveSqliteUrl(filePath: string): string {
  return `file:${path.resolve(filePath).replaceAll('\\', '/')}`;
}

function samePath(first: string, second: string): boolean {
  const resolvedFirst = path.resolve(first);
  const resolvedSecond = path.resolve(second);
  return process.platform === 'win32'
    ? resolvedFirst.toLowerCase() === resolvedSecond.toLowerCase()
    : resolvedFirst === resolvedSecond;
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

async function uniqueBackupPath(prefix: string): Promise<string> {
  const base = path.resolve('backups', `${prefix}-${timestamp()}`);
  let suffix = 0;
  let candidate = `${base}.db`;

  while (await pathExists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}.db`;
  }

  return candidate;
}

async function getDatabasePath(client: PrismaClient): Promise<string> {
  const databases = await client.$queryRaw<Array<{ name: string; file: string }>>`PRAGMA database_list`;
  const mainDatabase = databases.find((database) => database.name === 'main');

  if (!mainDatabase?.file) {
    throw new Error('Não foi possível determinar o caminho do banco SQLite.');
  }

  return path.resolve(mainDatabase.file);
}

async function createBackup(client: PrismaClient, destination: string): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });

  let backupCreated = false;
  try {
    await client.$executeRaw`VACUUM INTO ${destination.replaceAll('\\', '/')}`;
    backupCreated = true;
    const backupClient = new PrismaClient({ datasourceUrl: resolveSqliteUrl(destination) });
    try {
      await backupClient.$connect();
      await assertDatabaseConsistency(backupClient);
    } finally {
      await backupClient.$disconnect();
    }
  } catch (error) {
    if (backupCreated) await rm(destination, { force: true });
    throw new Error(`Falha ao criar ou validar o backup em "${destination}".`, { cause: error });
  }
}

async function check(): Promise<void> {
  await prisma.$connect();
  await assertDatabaseConsistency();
  console.log('✅ SQLite consistente: schema presente; integrity_check=ok; foreign_key_check=0 violações.');
}

async function backup(destinationArgument?: string): Promise<void> {
  await prisma.$connect();
  const destination = destinationArgument
    ? path.resolve(destinationArgument)
    : path.resolve('backups', `pegasus-${timestamp()}.db`);
  const databasePath = await getDatabasePath(prisma);

  if (samePath(destination, databasePath)) {
    throw new Error('O destino do backup não pode ser o próprio banco SQLite.');
  }

  if (await pathExists(destination)) {
    throw new Error(`O arquivo de destino já existe: "${destination}".`);
  }
  await createBackup(prisma, destination);
  console.log(`✅ Backup criado e validado: ${destination}`);
}

async function restore(sourceArgument?: string): Promise<void> {
  if (!sourceArgument) {
    throw new Error('Informe o arquivo de backup: npm run db:restore -- <arquivo.db>');
  }

  const source = path.resolve(sourceArgument);
  const sourceStats = await stat(source);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`O arquivo de backup está vazio ou não é um arquivo: "${source}".`);
  }

  const sourceClient = new PrismaClient({ datasourceUrl: resolveSqliteUrl(source) });
  try {
    await sourceClient.$connect();
    await assertDatabaseConsistency(sourceClient);
  } finally {
    await sourceClient.$disconnect();
  }

  await prisma.$connect();
  const databasePath = await getDatabasePath(prisma);
  if (samePath(source, databasePath)) {
    throw new Error('O arquivo de backup não pode ser o próprio banco SQLite.');
  }

  const safetyBackup = await uniqueBackupPath('pre-restore');
  let hasSafetyBackup = false;
  try {
    const currentDatabase = await stat(databasePath);
    if (currentDatabase.size > 0) {
      await createBackup(prisma, safetyBackup);
      hasSafetyBackup = true;
    }
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  await prisma.$disconnect();
  try {
    await copyFile(source, databasePath);
    const restoredClient = new PrismaClient();
    try {
      await restoredClient.$connect();
      await assertDatabaseConsistency(restoredClient);
    } finally {
      await restoredClient.$disconnect();
    }
  } catch (error) {
    if (hasSafetyBackup) {
      await copyFile(safetyBackup, databasePath);
      throw new Error(
        `A restauração falhou; o banco anterior foi recuperado de "${safetyBackup}".`,
        { cause: error },
      );
    }
    throw new Error('A restauração falhou e não havia banco anterior para recuperar.', { cause: error });
  }

  console.log(`✅ Banco restaurado e validado a partir de: ${source}`);
  if (hasSafetyBackup) console.log(`Backup anterior preservado em: ${safetyBackup}`);
}

async function main(): Promise<void> {
  const [command, argument] = process.argv.slice(2);
  switch (command) {
    case 'check':
      await check();
      break;
    case 'backup':
      await backup(argument);
      break;
    case 'restore':
      await restore(argument);
      break;
    default:
      throw new Error('Comando inválido. Use: check, backup ou restore.');
  }
}

main()
  .catch((error: unknown) => {
    console.error('❌ Operação SQLite falhou:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
