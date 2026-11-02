import { GrammyError } from 'grammy';
import { bot } from './bot.instance';
import { userMiddleware } from './middlewares/user.middleware';
import { botErrorHandler } from './middlewares/error.middleware';
import { handleStartCommand } from './handlers/commands/start.handler';
import { handleHelpCommand } from './handlers/commands/help.handler';
import { handleExpenseCommand } from './handlers/commands/expense.handler';
import { handleIncomeCommand } from './handlers/commands/income.handler';
import { handleBalanceCommand } from './handlers/commands/balance.handler';
import { handleStatementCommand } from './handlers/commands/statement.handler';
import { handleSummaryCommand } from './handlers/commands/summary.handler';
import { handleCategoriesCommand } from './handlers/commands/categories.handler';
import { handleActionCallback } from './handlers/callbacks/action.callback';
import { handleFallbackMessage } from './handlers/messages/fallback.handler';

export class BotModule {
  public static init() {
    // 1. Middlewares
    bot.use(userMiddleware);

    // 2. Comandos
    bot.command('start', handleStartCommand);
    bot.command('ajuda', handleHelpCommand);
    bot.command('gasto', handleExpenseCommand);
    bot.command('missao', handleExpenseCommand);
    bot.command('receita', handleIncomeCommand);
    bot.command('recompensa', handleIncomeCommand);
    bot.command('saldo', handleBalanceCommand);
    bot.command('bolsa', handleBalanceCommand);
    bot.command('extrato', handleStatementCommand);
    bot.command('diario', handleStatementCommand);
    bot.command('resumo', handleSummaryCommand);
    bot.command('mapa', handleSummaryCommand);
    bot.command('categorias', handleCategoriesCommand);
    bot.command('guilda', handleCategoriesCommand);

    // 3. Callback Queries (Botões Inline)
    bot.callbackQuery(/^action_/, handleActionCallback);

    // 4. Mensagens de texto gerais (fallback / futuro LLM)
    bot.on('message:text', handleFallbackMessage);

    // 5. Tratamento de Erros
    bot.catch(botErrorHandler);
  }

  public static async registerCommandsMenu(): Promise<boolean> {
    try {
      await bot.api.setMyCommands([
        { command: 'start', description: 'Começa sua jornada financeira' },
        { command: 'missao', description: 'Registra um gasto' },
        { command: 'recompensa', description: 'Registra um ganho' },
        { command: 'bolsa', description: 'Confere o saldo do mês' },
        { command: 'diario', description: 'Mostra os últimos registros' },
        { command: 'mapa', description: 'Mostra gastos por categoria' },
        { command: 'guilda', description: 'Lista suas categorias' },
        { command: 'ajuda', description: 'Abre o grimório de comandos' },
      ]);
      console.log('✅ [Telegram] Comandos do menu registrados com sucesso.');
      return true;
    } catch (error: unknown) {
      if (error instanceof GrammyError && [401, 404].includes(error.error_code)) {
        return false;
      }
      throw error;
    }
  }
}
