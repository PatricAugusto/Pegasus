import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { formatCurrency, formatShortDateBR } from '../../../../common/formatters';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function renderStatementText(userId: string, limit: number = 10): Promise<string> {
  const items = await transactionService.getRecent(userId, limit);

  if (items.length === 0) {
    return '📝 *Seu extrato está vazio.*\nRegistre seus primeiros lançamentos com `/gasto` ou `/receita`.';
  }

  let text = `📝 *Últimas ${items.length} Movimentações:*\n━━━━━━━━━━━━━━━━━━━━\n`;

  for (const item of items) {
    const isIncome = item.type === 'INCOME';
    const symbol = isIncome ? '🟢 +' : '🔴 -';
    const icon = item.category?.icon || (isIncome ? '💰' : '🏷️');
    const dateFormatted = formatShortDateBR(item.date);

    text += `${icon} *${item.description}* \`(${dateFormatted})\`\n`;
    text += `   ↳ ${symbol} \`${formatCurrency(item.amount)}\` _[${item.category?.name || 'Geral'}]_\n\n`;
  }

  return text;
}

export async function handleStatementCommand(ctx: CommandContext<BotContext>) {
  const dbUser = ctx.dbUser;
  if (!dbUser) {
    return ctx.reply('❌ Usuário não identificado. Envie /start para inicializar.');
  }

  const text = await renderStatementText(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
