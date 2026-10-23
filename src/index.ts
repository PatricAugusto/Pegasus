import { app } from './modules/http/app';
import { bot } from './modules/bot/bot.instance';
import { BotModule } from './modules/bot/bot.module';
import { env } from './config/env';
import { connectDB } from './db/prisma';
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
  } else {
    await BotModule.registerCommandsMenu();

    if (!env.WEBHOOK_URL) {
      bot.start({
        onStart: (botInfo) => {
          console.log(`🤖 [Telegram] Bot @${botInfo.username} online e escutando via Polling!`);
        },
      });
    } else {
      console.log(`📡 [Telegram] Bot operando via Webhook em: ${env.WEBHOOK_URL}`);
    }
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 [Shutdown] Recebido sinal ${signal}. Encerrando aplicação com segurança...`);
    server.close();
    if (bot.isInited()) {
      await bot.stop();
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('💥 [Erro Fatal] Falha na inicialização do Pegasus:', err);
  process.exit(1);
});
