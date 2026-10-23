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
    bot.command('receita', handleIncomeCommand);
    bot.command('saldo', handleBalanceCommand);
    bot.command('extrato', handleStatementCommand);
    bot.command('resumo', handleSummaryCommand);
    bot.command('categorias', handleCategoriesCommand);

    // 3. Callback Queries (Botões Inline)
    bot.callbackQuery(/^action_/, handleActionCallback);

    // 4. Mensagens de texto gerais (fallback / futuro LLM)
    bot.on('message:text', handleFallbackMessage);

    // 5. Tratamento de Erros
    bot.catch(botErrorHandler);
  }

  public static async registerCommandsMenu() {
    try {
      await bot.api.setMyCommands([
        { command: 'start', description: 'Inicia o bot e exibe o menu' },
        { command: 'saldo', description: 'Exibe o saldo e totais do mês' },
        { command: 'gasto', description: 'Registra despesa (/gasto 25.50 Almoço)' },
        { command: 'receita', description: 'Registra receita (/receita 3000 Salário)' },
        { command: 'extrato', description: 'Lista as últimas transações' },
        { command: 'resumo', description: 'Gastos detalhados por categoria' },
        { command: 'categorias', description: 'Lista as categorias disponíveis' },
        { command: 'ajuda', description: 'Instruções e exemplos de uso' },
      ]);
      console.log('✅ [Telegram] Comandos do menu registrados com sucesso.');
    } catch {
      console.warn('⚠️ [Telegram] Não foi possível registrar os comandos do menu (verifique se o token é válido).');
    }
  }
}
