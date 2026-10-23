import { CommandContext } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleHelpCommand(ctx: CommandContext<BotContext>) {
  const helpText =
    `📚 *Guia de Comandos do Bot*\n\n` +
    `*1. Registrar Despesa:*\n` +
    `\`\/gasto <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/gasto 45.90 Almoço de domingo Alimentação\`\n` +
    `Exemplo: \`/gasto 12,50 Padaria\`\n\n` +
    `*2. Registrar Receita:*\n` +
    `\`\/receita <valor> <descrição> [categoria]\`\n` +
    `Exemplo: \`/receita 3500 Salário Mensal Salário\`\n` +
    `Exemplo: \`/receita 150 Venda Usado Renda Extra\`\n\n` +
    `*3. Consultas:*\n` +
    `• \`/saldo\`: Total de receitas, despesas e balanço líquido do mês.\n` +
    `• \`/extrato\`: Histórico das 10 últimas movimentações.\n` +
    `• \`/resumo\`: Gráfico percentual de gastos por categoria.\n` +
    `• \`/categorias\`: Exibe todas as categorias cadastradas.\n\n` +
    `💡 _Dica: Você pode digitar valores com ponto ou vírgula (ex: 29.90 ou 29,90)._`;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: getMainKeyboard(),
  });
}
