import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleStartCommand(ctx: CommandContext<BotContext>) {
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
}
