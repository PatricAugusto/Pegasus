import { BotError } from 'grammy';
import { BotContext } from '../bot.context';

export function botErrorHandler(err: BotError<BotContext>) {
  console.error('❌ [Telegram Bot Error]:', err.error);
}
