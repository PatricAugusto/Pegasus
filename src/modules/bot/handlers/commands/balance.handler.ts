import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { transactionService } from '../../../transactions/transaction.service';
import { formatCurrency, getMonthName } from '../../../../common/formatters';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function renderBalanceText(userId: string): Promise<string> {
  const balance = await transactionService.getBalance(userId);
  const isPositive = balance.netBalance >= 0;
  const statusEmoji = isPositive ? '🟢' : '🔴';
  const currentMonthName = getMonthName(balance.month);

  return (
    `💰 *Bolsa da jornada — ${currentMonthName}/${balance.year}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📈 *Ganhos:*  \`${formatCurrency(balance.totalIncome)}\`\n` +
    `🛡️ *Gastos:*  \`${formatCurrency(balance.totalExpense)}\`\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${statusEmoji} *Resultado do mês:*   \`${formatCurrency(balance.netBalance)}\`\n\n` +
    `🧾 *Registros na jornada:* ${balance.transactionCount}`
  );
}

export async function handleBalanceCommand(ctx: CommandContext<BotContext>) {
  const dbUser = ctx.dbUser;
  if (!dbUser) {
    return ctx.reply('❌ Usuário não identificado. Envie /start para inicializar.');
  }

  const text = await renderBalanceText(dbUser.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
