import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { formatCurrency } from '../../../../common/formatters';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function renderSummaryText(userId: string): Promise<string> {
  const summary = await transactionService.getMonthlySummaryByCategory(userId);

  if (summary.breakdown.length === 0) {
    return '🧭 *Seu mapa ainda está em branco.*\nRegistre uma missão para ver como seus gastos se distribuem.';
  }

  let text = `🧭 *Mapa da jornada — gastos do mês*\n`;
  text += `💸 *Total em missões:* \`${formatCurrency(summary.totalExpenses)}\`\n━━━━━━━━━━━━━━━━━━━━\n`;

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
    return ctx.reply('❌ Perfil não encontrado. Envie /start para iniciar sua jornada.');
  }

  const text = await renderSummaryText(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
