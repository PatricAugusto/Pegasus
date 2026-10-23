import { Bot } from 'grammy';
import { env } from '../../config/env';
import { BotContext } from './bot.context';

export const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);
