import { GrammyError } from 'grammy';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bot } from '../../../src/modules/bot/bot.instance';
import { BotModule } from '../../../src/modules/bot/bot.module';

describe('Modules: Bot startup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([401, 404])('does not start polling when Telegram rejects the bot token (%i)', async (errorCode) => {
    vi.spyOn(bot.api, 'setMyCommands').mockRejectedValue(
      new GrammyError(
        'Token rejected',
        { ok: false, error_code: errorCode, description: 'Token rejected' },
        'setMyCommands',
        {},
      ),
    );

    await expect(BotModule.registerCommandsMenu()).resolves.toBe(false);
  });

  it('surfaces command registration errors other than unauthorized', async () => {
    const error = new Error('Telegram API unavailable');
    vi.spyOn(bot.api, 'setMyCommands').mockRejectedValue(error);

    await expect(BotModule.registerCommandsMenu()).rejects.toBe(error);
  });

  it('registers RPG command aliases alongside the existing commands', () => {
    const commandSpy = vi.spyOn(bot, 'command');

    BotModule.init();

    const registeredCommands = commandSpy.mock.calls.map(([command]) => command);
    expect(registeredCommands).toEqual(
      expect.arrayContaining(['missao', 'recompensa', 'bolsa', 'diario', 'mapa', 'guilda']),
    );
  });
});
