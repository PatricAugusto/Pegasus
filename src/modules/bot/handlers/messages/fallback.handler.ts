import { Filter, Context } from 'grammy';
import { BotContext } from '../../bot.context';
import { getMainKeyboard } from '../../keyboards/main.keyboard';

export async function handleFallbackMessage(ctx: Filter<BotContext, 'message:text'>) {
  if (ctx.message.text.startsWith('/')) {
    return ctx.reply('❓ Esse comando não está no seu grimório. Use /ajuda para consultar os atalhos.', {
      reply_markup: getMainKeyboard(),
    });
  }

  // PONTO DE INTEGRAÇÃO FUTURA: Agente Orquestrador LLM (Gemini)
  await ctx.reply(
    `📨 Recebi sua mensagem: _"${ctx.message.text}"_\n\n` +
      `Ainda não entendo mensagens livres, mas estes atalhos resolvem rapidinho:\n` +
      `• \`/missao <valor> <descrição>\` para registrar um gasto\n` +
      `• \`/recompensa <valor> <descrição>\` para registrar um ganho\n` +
      `• \`/bolsa\` para conferir o saldo`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    }
  );
}
