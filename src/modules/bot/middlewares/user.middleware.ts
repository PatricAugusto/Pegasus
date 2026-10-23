import { NextFunction } from 'grammy';
import { BotContext } from '../bot.context';
import { userService } from '../../users/user.service';

export async function userMiddleware(ctx: BotContext, next: NextFunction) {
  if (ctx.from) {
    ctx.dbUser = await userService.getOrCreateUser(ctx.from);
  }
  await next();
}
