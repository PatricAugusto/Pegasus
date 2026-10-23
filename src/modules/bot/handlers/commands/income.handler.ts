import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { categoryService } from '../../../categories/category.service';
import { formatCurrency, formatDateBR } from '../../../../common/formatters';
import { getTransactionFeedbackKeyboard } from '../../keyboards/main.keyboard';

export async function handleIncomeCommand(ctx: CommandContext<BotContext>) {
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
    reply_markup: getTransactionFeedbackKeyboard(),
  });
}
