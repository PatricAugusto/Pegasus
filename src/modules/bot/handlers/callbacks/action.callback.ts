import { CallbackQueryContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { renderBalanceText } from '../commands/balance.handler';
import { renderStatementText } from '../commands/statement.handler';
import { renderSummaryText } from '../commands/summary.handler';
import { renderCategoriesText } from '../commands/categories.handler';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleActionCallback(ctx: CallbackQueryContext<BotContext>) {
  await ctx.answerCallbackQuery();
  const dbUser = ctx.dbUser;
  if (!dbUser) return;

  const data = ctx.callbackQuery.data;

  switch (data) {
    case 'action_saldo': {
      const text = await renderBalanceText(dbUser.id);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: getMainKeyboard() });
      break;
    }
    case 'action_extrato': {
      const text = await renderStatementText(dbUser.id);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: getMainKeyboard() });
      break;
    }
    case 'action_resumo': {
      const text = await renderSummaryText(dbUser.id);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: getMainKeyboard() });
      break;
    }
    case 'action_categorias': {
      const text = await renderCategoriesText(dbUser.id);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: getMainKeyboard() });
      break;
    }
    case 'action_ajuda': {
      const helpText =
        `💡 *Exemplos rápidos de uso:*\n\n` +
        `• Registrar café: \`/gasto 6.50 Café Expresso Alimentação\`\n` +
        `• Registrar uber: \`/gasto 22.90 Corrida Transporte\`\n` +
        `• Registrar salário: \`/receita 4000 Salário Mensal\`\n` +
        `• Ver saldo: \`/saldo\``;
      await ctx.reply(helpText, { parse_mode: 'Markdown', reply_markup: getMainKeyboard() });
      break;
    }
    default:
      break;
  }
}
