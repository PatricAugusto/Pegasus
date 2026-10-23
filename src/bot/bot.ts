import { Bot, Context, InlineKeyboard } from 'grammy';
import { User } from '@prisma/client';
import { env } from '../config/env';
import { getOrCreateUser } from '../services/user.service';
import {
  createTransaction,
  formatCurrency,
  formatDateBR,
  getBalance,
  getMonthlySummaryByCategory,
  getRecentTransactions,
} from '../services/transaction.service';
import { getCategoriesForUser } from '../services/category.service';

// Contexto estendido do GrammY com os dados do usuário do Prisma
export interface BotContext extends Context {
  dbUser?: User;
}

export const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

// Teclado principal de atalhos rápidos
export function getMainKeyboard() {
  return new InlineKeyboard()
    .text('📊 Saldo do Mês', 'action_saldo')
    .text('📝 Extrato', 'action_extrato')
    .row()
    .text('📈 Resumo por Categoria', 'action_resumo')
    .text('🏷️ Categorias', 'action_categorias')
    .row()
    .text('❓ Ajuda & Comandos', 'action_ajuda');
}

// Configura os comandos nativos no menu do Telegram
export async function setupBotCommands() {
  try {
    await bot.api.setMyCommands([
      { command: 'start', description: 'Inicia o bot e exibe o menu' },
      { command: 'saldo', description: 'Exibe o saldo e totais do mês' },
      { command: 'gasto', description: 'Registra despesa (/gasto 25.50 Almoço)' },
      { command: 'receita', description: 'Registra receita (/receita 3000 Salário)' },
      { command: 'extrato', description: 'Lista as últimas transações' },
      { command: 'resumo', description: 'Gastos detalhados por categoria' },
      { command: 'categorias', description: 'Lista as categorias disponíveis' },
      { command: 'ajuda', description: 'Instruções e exemplos de uso' },
    ]);
    console.log('✅ [Telegram] Comandos do menu registrados com sucesso.');
  } catch (error) {
    console.warn('⚠️ [Telegram] Não foi possível registrar os comandos do menu (verifique se o token é válido).');
  }
}

// Middleware para garantir que o usuário existe no banco
bot.use(async (ctx, next) => {
  if (ctx.from) {
    ctx.dbUser = await getOrCreateUser(ctx.from);
  }
  await next();
});

// Comando /start
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'Investidor(a)';
  const welcomeText =
    `👋 Olá, *${name}*! Seja bem-vindo ao seu *Assistente Financeiro Pessoal*.\n\n` +
    `Estou aqui para ajudá-lo a gerenciar suas receitas, despesas e orçamentos com máxima agilidade.\n\n` +
    `🚀 *Como começar:* Utilize os botões abaixo ou envie comandos rápidos:\n` +
    `• \`/gasto 35.50 Almoço Alimentação\`\n` +
    `• \`/receita 2500 Salário\`\n` +
    `• \`/saldo\` para ver suas finanças do mês.`;

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Comando /ajuda
bot.command('ajuda', async (ctx) => {
  const helpText =
    `📚 *Guia de Comandos do Bot*\n\n` +
    `*1. Registrar Despesa:*\n` +
    `\`\/gasto <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/gasto 45.90 Almoço de domingo Alimentação\`\n` +
    `Exemplo: \`/gasto 12,50 Padaria\`\n\n` +
    `*2. Registrar Receita:*\n` +
    `\`\/receita <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/receita 3500 Salário Mensal Salário\`\n` +
    `Exemplo: \`/receita 150 Venda Usado Renda Extra\`\n\n` +
    `*3. Consultas:*\n` +
    `• \`/saldo\`: Total de receitas, despesas e balanço líquido do mês.\n` +
    `• \`/extrato\`: Histórico das 10 últimas movimentações.\n` +
    `• \`/resumo\`: Gráfico percentual de gastos por categoria.\n` +
    `• \`/categorias\`: Exibe todas as categorias cadastradas.\n\n` +
    `💡 _Dica: Você pode digitar valores com ponto ou vírgula (ex: 29.90 ou 29,90)._`;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Comando /gasto <valor> <descrição> [categoria]
bot.command('gasto', async (ctx) => {
  const rawText = ctx.match?.trim();
  const dbUser = ctx.dbUser;

  if (!dbUser) {
    return ctx.reply('❌ Usuário não identificado. Envie /start para inicializar.');
  }

  if (!rawText) {
    return ctx.reply(
      `⚠️ *Como usar o /gasto:*\n\n` +
        `Envie o valor e a descrição:\n` +
        `Ex: \`/gasto 32.50 Gasolina Transporte\`\n` +
        `Ex: \`/gasto 15 Café com pão\``,
      { parse_mode: 'Markdown' }
    );
  }

  // Regex para capturar valor e restante
  const parts = rawText.match(/^([0-9]+[.,]?[0-9]*)\s+(.+)$/);
  if (!parts) {
    return ctx.reply('⚠️ Formato inválido. Use: `/gasto <valor> <descrição>`\nExemplo: `/gasto 45.00 Mercado`', {
      parse_mode: 'Markdown',
    });
  }

  const rawAmount = parts[1].replace(',', '.');
  const amount = parseFloat(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Por favor, informe um valor numérico válido maior que zero.');
  }

  const descriptionAndCategory = parts[2].trim();
  const words = descriptionAndCategory.split(' ');

  let categoryName: string | undefined = undefined;
  let description = descriptionAndCategory;

  if (words.length > 1) {
    const candidateCategory = words[words.length - 1];
    const categories = await getCategoriesForUser(dbUser.id);
    const matched = categories.find((c) => c.name.toLowerCase() === candidateCategory.toLowerCase());

    if (matched) {
      categoryName = matched.name;
      description = words.slice(0, -1).join(' ');
    }
  }

  const transaction = await createTransaction({
    userId: dbUser.id,
    amount,
    type: 'EXPENSE',
    description,
    categoryName,
    source: 'COMMAND',
  });

  const catIcon = transaction.category?.icon || '🏷️';
  const catName = transaction.category?.name || 'Geral';

  const replyMsg =
    `✅ *Despesa Registrada com Sucesso!*\n\n` +
    `💸 *Valor:* \`${formatCurrency(amount)}\`\n` +
    `📝 *Descrição:* ${transaction.description}\n` +
    `📂 *Categoria:* ${catIcon} ${catName}\n` +
    `📅 *Data:* ${formatDateBR(transaction.date)}\n`;

  await ctx.reply(replyMsg, {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard()
      .text('📊 Ver Saldo Atualizado', 'action_saldo')
      .text('📝 Extrato', 'action_extrato'),
  });
});

// Comando /receita <valor> <descrição> [categoria]
bot.command('receita', async (ctx) => {
  const rawText = ctx.match?.trim();
  const dbUser = ctx.dbUser;

  if (!dbUser) {
    return ctx.reply('❌ Usuário não identificado. Envie /start para inicializar.');
  }

  if (!rawText) {
    return ctx.reply(
      `⚠️ *Como usar o /receita:*\n\n` +
        `Envie o valor e a descrição:\n` +
        `Ex: \`/receita 3000 Salário Salário\`\n` +
        `Ex: \`/receita 250 Freelance\``,
      { parse_mode: 'Markdown' }
    );
  }

  const parts = rawText.match(/^([0-9]+[.,]?[0-9]*)\s+(.+)$/);
  if (!parts) {
    return ctx.reply('⚠️ Formato inválido. Use: `/receita <valor> <descrição>`\nExemplo: `/receita 2000 Salário`', {
      parse_mode: 'Markdown',
    });
  }

  const rawAmount = parts[1].replace(',', '.');
  const amount = parseFloat(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('❌ Por favor, informe um valor numérico válido maior que zero.');
  }

  const descriptionAndCategory = parts[2].trim();
  const words = descriptionAndCategory.split(' ');

  let categoryName = 'Salário';
  let description = descriptionAndCategory;

  if (words.length > 1) {
    const candidateCategory = words[words.length - 1];
    const categories = await getCategoriesForUser(dbUser.id);
    const matched = categories.find((c) => c.name.toLowerCase() === candidateCategory.toLowerCase());

    if (matched) {
      categoryName = matched.name;
      description = words.slice(0, -1).join(' ');
    }
  }

  const transaction = await createTransaction({
    userId: dbUser.id,
    amount,
    type: 'INCOME',
    description,
    categoryName,
    source: 'COMMAND',
  });

  const catIcon = transaction.category?.icon || '💰';
  const catName = transaction.category?.name || 'Receitas';

  const replyMsg =
    `🎉 *Receita Adicionada com Sucesso!*\n\n` +
    `💰 *Valor:* \`${formatCurrency(amount)}\`\n` +
    `📝 *Descrição:* ${transaction.description}\n` +
    `📂 *Categoria:* ${catIcon} ${catName}\n` +
    `📅 *Data:* ${formatDateBR(transaction.date)}\n`;

  await ctx.reply(replyMsg, {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard()
      .text('📊 Ver Saldo Atualizado', 'action_saldo')
      .text('📝 Extrato', 'action_extrato'),
  });
});

// Helper para renderizar Saldo
async function renderBalanceMessage(userId: string) {
  const balance = await getBalance(userId);
  const isPositive = balance.netBalance >= 0;
  const statusEmoji = isPositive ? '🟢' : '🔴';

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthName = monthNames[balance.month - 1];

  return (
    `📊 *Balanço Financeiro — ${currentMonthName}/${balance.year}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📈 *Total de Receitas:*  \`${formatCurrency(balance.totalIncome)}\`\n` +
    `📉 *Total de Despesas:*  \`${formatCurrency(balance.totalExpense)}\`\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${statusEmoji} *Saldo Líquido:*   \`${formatCurrency(balance.netBalance)}\`\n\n` +
    `🔢 *Total de Lançamentos:* ${balance.transactionCount}`
  );
}

// Comando /saldo
bot.command('saldo', async (ctx) => {
  const dbUser = ctx.dbUser;
  if (!dbUser) return ctx.reply('Envie /start para inicializar.');

  const text = await renderBalanceMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Helper para extrato
async function renderStatementMessage(userId: string, limit: number = 10) {
  const items = await getRecentTransactions(userId, limit);

  if (items.length === 0) {
    return '📝 *Seu extrato está vazio.*\nRegistre seus primeiros lançamentos com `/gasto` ou `/receita`.';
  }

  let text = `📝 *Últimas ${items.length} Movimentações:*\n━━━━━━━━━━━━━━━━━━━━\n`;

  for (const item of items) {
    const isIncome = item.type === 'INCOME';
    const symbol = isIncome ? '🟢 +' : '🔴 -';
    const icon = item.category?.icon || (isIncome ? '💰' : '🏷️');
    const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(item.date);

    text += `${icon} *${item.description}* \`(${dateFormatted})\`\n`;
    text += `   ↳ ${symbol} \`${formatCurrency(item.amount)}\` _[${item.category?.name || 'Geral'}]_\n\n`;
  }

  return text;
}

// Comando /extrato
bot.command('extrato', async (ctx) => {
  const dbUser = ctx.dbUser;
  if (!dbUser) return ctx.reply('Envie /start para inicializar.');

  const text = await renderStatementMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Helper para resumo por categoria
async function renderSummaryMessage(userId: string) {
  const summary = await getMonthlySummaryByCategory(userId);

  if (summary.breakdown.length === 0) {
    return '📊 *Nenhum gasto registrado neste mês ainda.*';
  }

  let text = `📊 *Distribuição de Gastos do Mês:*\n`;
  text += `💸 *Total Gasto:* \`${formatCurrency(summary.totalExpenses)}\`\n━━━━━━━━━━━━━━━━━━━━\n`;

  for (const item of summary.breakdown) {
    const progressBar = '█'.repeat(Math.round(item.percentage / 10)).padEnd(10, '░');
    text += `${item.icon} *${item.name}:* \`${formatCurrency(item.total)}\` (${item.percentage.toFixed(1)}%)\n`;
    text += `   [${progressBar}] (${item.count} un)\n\n`;
  }

  return text;
}

// Comando /resumo
bot.command('resumo', async (ctx) => {
  const dbUser = ctx.dbUser;
  if (!dbUser) return ctx.reply('Envie /start para inicializar.');

  const text = await renderSummaryMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Comando /categorias
bot.command('categorias', async (ctx) => {
  const dbUser = ctx.dbUser;
  const categories = await getCategoriesForUser(dbUser?.id);

  const expenses = categories.filter((c) => c.type === 'EXPENSE');
  const incomes = categories.filter((c) => c.type === 'INCOME');

  let text = `🏷️ *Categorias Disponíveis*\n\n`;
  text += `*🔴 Despesas:*\n`;
  for (const c of expenses) {
    text += `• ${c.icon || '🏷️'} ${c.name}\n`;
  }

  text += `\n*🟢 Receitas:*\n`;
  for (const c of incomes) {
    text += `• ${c.icon || '💰'} ${c.name}\n`;
  }

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Ações dos botões Inline do Telegram
bot.callbackQuery('action_saldo', async (ctx) => {
  await ctx.answerCallbackQuery();
  const dbUser = ctx.dbUser;
  if (!dbUser) return;
  const text = await renderBalanceMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery('action_extrato', async (ctx) => {
  await ctx.answerCallbackQuery();
  const dbUser = ctx.dbUser;
  if (!dbUser) return;
  const text = await renderStatementMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery('action_resumo', async (ctx) => {
  await ctx.answerCallbackQuery();
  const dbUser = ctx.dbUser;
  if (!dbUser) return;
  const text = await renderSummaryMessage(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery('action_categorias', async (ctx) => {
  await ctx.answerCallbackQuery();
  const dbUser = ctx.dbUser;
  const categories = await getCategoriesForUser(dbUser?.id);

  let text = `🏷️ *Categorias Cadastradas:*\n\n`;
  for (const c of categories) {
    text += `${c.icon || '🏷️'} ${c.name} (${c.type === 'INCOME' ? 'Receita' : 'Despesa'})\n`;
  }

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery('action_ajuda', async (ctx) => {
  await ctx.answerCallbackQuery();
  const helpText =
    `💡 *Exemplos rápidos de uso:*\n\n` +
    `• Registrar café: \`/gasto 6.50 Café Expresso Alimentação\`\n` +
    `• Registrar uber: \`/gasto 22.90 Corrida Transporte\`\n` +
    `• Registrar salário: \`/receita 4000 Salário Mensal\`\n` +
    `• Ver saldo: \`/saldo\``;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
});

// Mensagens de texto gerais (preparação para Agente LLM futuro)
bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) {
    return ctx.reply('❓ Comando não reconhecido. Use /ajuda para ver a lista de comandos.', {
      reply_markup: getMainKeyboard(),
    });
  }

  await ctx.reply(
    `🤖 Recebi sua mensagem: _"${ctx.message.text}"_\n\n` +
      `Na próxima etapa, nosso **Agente LLM** entenderá mensagens naturais, áudios e comprovantes automaticamente!\n\n` +
      `Por enquanto, utilize os comandos estruturados:\n` +
      `• \`/gasto <valor> <descrição>\`\n` +
      `• \`/receita <valor> <descrição>\`\n` +
      `• \`/saldo\``,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    }
  );
});

// Tratamento global de erros do bot
bot.catch((err) => {
  console.error('❌ [Bot Error] Erro capturado no ciclo do Telegram:', err);
});
