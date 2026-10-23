import { InlineKeyboard } from 'grammy';

export function getMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Saldo do Mês', 'action_saldo')
    .text('📝 Extrato', 'action_extrato')
    .row()
    .text('📈 Resumo por Categoria', 'action_resumo')
    .text('🏷️ Categorias', 'action_categorias')
    .row()
    .text('❓ Ajuda & Comandos', 'action_ajuda');
}

export function getTransactionFeedbackKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Ver Saldo Atualizado', 'action_saldo')
    .text('📝 Extrato', 'action_extrato');
}
