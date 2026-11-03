import { GrammyError } from 'grammy';
import { app } from './modules/http/app';
import { bot } from './modules/bot/bot.instance';
import { BotModule } from './modules/bot/bot.module';
import { env } from './config/env';
import { connectDB, disconnectDB } from './db/prisma';
import { categoryService } from './modules/categories/category.service';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 [Pegasus] Inicializando Assistente Financeiro...');
  console.log('----------------------------------------------------');

  // 1. Conexão com o banco de dados SQLite
  await connectDB();

  // 2. Inicialização e verificação de categorias padrão
  await categoryService.seedDefaultCategories();
  console.log('🏷️ [Categorias] Categorias padrão verificadas/inicializadas.');

  // 3. Inicialização dos componentes do Bot (Middlewares, Comandos, Callbacks)
  BotModule.init();

  // 4. Inicializa o servidor Express HTTP
  const server = app.listen(env.PORT, () => {
    console.log(`🌐 [Express] Servidor HTTP rodando em http://localhost:${env.PORT}`);
    console.log(`🩺 [Healthcheck] http://localhost:${env.PORT}/health`);
    console.log(`📊 [API Resumo] http://localhost:${env.PORT}/api/transactions`);
  });

  // 5. Inicialização do Bot do Telegram
  if (!env.TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN === 'SEU_TOKEN_AQUI') {
    console.log('----------------------------------------------------');
    console.log('⚠️ [Telegram] Token do bot não configurado no arquivo .env.');
    console.log('👉 Adicione seu token gerado pelo @BotFather na variável TELEGRAM_BOT_TOKEN.');
    console.log('👉 A API Express e o SQLite continuarão funcionando normalmente.');
    console.log('----------------------------------------------------');
  } else if (await BotModule.registerCommandsMenu()) {
    if (!env.WEBHOOK_URL) {
      void bot.start({
        onStart: (botInfo) => {
          console.log(`🤖 [Telegram] Bot @${botInfo.username} online e escutando via Polling!`);
        },
      }).catch((error: unknown) => {
        if (isInvalidTelegramToken(error)) {
          logInvalidTelegramToken();
          return;
        }
        console.error('❌ [Telegram] Falha ao iniciar o bot:', error);
      });
    } else {
      console.log(`📡 [Telegram] Bot operando via Webhook em: ${env.WEBHOOK_URL}`);
    }
  } else {
    logInvalidTelegramToken();
  }

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 [Shutdown] Recebido sinal ${signal}. Encerrando aplicação com segurança...`);
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      if (bot.isInited()) {
        await bot.stop();
      }
    } finally {
      await disconnectDB();
    }
  };

  const handleShutdown = (signal: string) => {
    void shutdown(signal).catch((error: unknown) => {
      console.error(`❌ [Shutdown] Falha ao encerrar após ${signal}:`, error);
      process.exitCode = 1;
    });
  };
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

function logInvalidTelegramToken() {
  console.error('⚠️ [Telegram] O Telegram rejeitou o token do bot (401 Unauthorized ou 404 Not Found).');
  console.error('👉 Gere ou confira o token com o @BotFather e atualize TELEGRAM_BOT_TOKEN no arquivo .env.');
  console.error('👉 O servidor HTTP e o banco de dados continuarão funcionando; reinicie o Pegasus após corrigir o token.');
}

function isInvalidTelegramToken(error: unknown): error is GrammyError {
  return error instanceof GrammyError && [401, 404].includes(error.error_code);
}

bootstrap().catch((err) => {
  console.error('💥 [Erro Fatal] Falha na inicialização do Pegasus:', err);
  process.exit(1);
});
