import { Filter, Context } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleFallbackMessage(ctx: Filter<BotContext, 'message:text'>) {
  if (ctx.message.text.startsWith('/')) {
    return ctx.reply('❓ Comando não reconhecido. Use /ajuda para ver a lista de comandos.', {
      reply_markup: getMainKeyboard(),
    });
  }

  // PONTO DE INTEGRAÇÃO FUTURA: Agente Orquestrador LLM (Gemini)
  await ctx.reply(
    `🤖 Recebi sua mensagem: _"${ctx.message.text}"_\n\n` +
      `Na próxima etapa, nosso **Agente LLM** entenderá mensagens em texto livre, áudios e comprovantes automaticamente!\n\n` +
      `Por enquanto, utilize os comandos estruturados:\n` +
      `• \`/gasto <valor> <descrição>\`\n` +
      `• \`/receita <valor> <descrição>\`\n` +
      `• \`/saldo\``,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    }
  );
}
