import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { formatCurrency } from '../../../../common/formatters';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function renderSummaryText(userId: string): Promise<string> {
  const summary = await transactionService.getMonthlySummaryByCategory(userId);

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

export async function handleSummaryCommand(ctx: CommandContext<BotContext>) {
  const dbUser = ctx.dbUser;
  if (!dbUser) {
    return ctx.reply('❌ Usuário não identificado. Envie /start para inicializar.');
  }

  const text = await renderSummaryText(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
