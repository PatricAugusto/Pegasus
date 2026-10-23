import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { categoryService } from '../../../categories/category.service';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function renderCategoriesText(userId?: string): Promise<string> {
  const categories = await categoryService.getCategoriesForUser(userId);

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

  return text;
}

export async function handleCategoriesCommand(ctx: CommandContext<BotContext>) {
  const dbUser = ctx.dbUser;
  const text = await renderCategoriesText(dbUser?.id);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
