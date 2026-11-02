import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleStartCommand(ctx: CommandContext<BotContext>) {
  const name = ctx.from?.first_name || 'Investidor(a)';
  const welcomeText =
    `👋 Olá, *${name}*! Sua jornada financeira começa aqui.\n\n` +
    `Registre ganhos e gastos sem perder tempo: eu mantenho seu diário e sua bolsa em ordem.\n\n` +
    `⚔️ *Missões rápidas:* use os botões ou envie um comando:\n` +
    `• \`/missao 35.50 Almoço Alimentação\` para registrar um gasto\n` +
    `• \`/recompensa 2500 Salário\` para registrar um ganho\n` +
    `• \`/bolsa\` para conferir o saldo do mês.`;

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
