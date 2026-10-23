import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { categoryService } from '../../../categories/category.service';
import { formatCurrency, formatDateBR } from '../../../../common/formatters';
import { getTransactionFeedbackKeyboard } from '../../keyboards/main.keyboard';

export async function handleExpenseCommand(ctx: CommandContext<BotContext>) {
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
    const categories = await categoryService.getCategoriesForUser(dbUser.id);
    const matched = categories.find((c) => c.name.toLowerCase() === candidateCategory.toLowerCase());

    if (matched) {
      categoryName = matched.name;
      description = words.slice(0, -1).join(' ');
    }
  }

  const transaction = await transactionService.create({
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
    reply_markup: getTransactionFeedbackKeyboard(),
  });
}
