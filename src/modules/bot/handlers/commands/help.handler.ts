import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleHelpCommand(ctx: CommandContext<BotContext>) {
  const helpText =
    `📖 *Grimório da jornada*\n\n` +
    `*⚔️ Missão — registrar uma despesa:*\n` +
    `\`/missao <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/missao 45.90 Almoço Alimentação\`\n\n` +
    `*🎁 Recompensa — registrar uma receita:*\n` +
    `\`/recompensa <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/recompensa 3500 Salário Mensal Salário\`\n\n` +
    `*🧭 Consultas da jornada:*\n` +
    `• \`/bolsa\`: saldo, ganhos e gastos do mês.\n` +
    `• \`/diario\`: últimas 10 movimentações.\n` +
    `• \`/mapa\`: gastos por categoria.\n` +
    `• \`/guilda\`: categorias disponíveis.\n\n` +
    `💡 _Os comandos clássicos também funcionam: /gasto, /receita, /saldo, /extrato, /resumo e /categorias. Valores aceitam ponto ou vírgula._`;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
