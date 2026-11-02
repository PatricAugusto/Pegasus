import { InlineKeyboard } from 'grammy';

export function getMainKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('💰 Bolsa do mês', 'action_saldo')
    .text('📜 Diário', 'action_extrato')
    .row()
    .text('🧭 Mapa de gastos', 'action_resumo')
    .text('🏰 Guilda', 'action_categorias')
    .row()
    .text('📖 Grimório', 'action_ajuda');
}

export function getTransactionFeedbackKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('💰 Ver bolsa', 'action_saldo')
    .text('📜 Abrir diário', 'action_extrato');
}
