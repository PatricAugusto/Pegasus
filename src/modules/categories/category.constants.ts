export interface DefaultCategory {
  name: string;
  icon: string;
  type: 'EXPENSE' | 'INCOME';
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Alimentação', icon: '🍔', type: 'EXPENSE', color: '#FF7043' },
  { name: 'Transporte', icon: '🚗', type: 'EXPENSE', color: '#42A5F5' },
  { name: 'Moradia', icon: '🏠', type: 'EXPENSE', color: '#AB47BC' },
  { name: 'Lazer', icon: '🎉', type: 'EXPENSE', color: '#FFA726' },
  { name: 'Saúde', icon: '💊', type: 'EXPENSE', color: '#EF5350' },
  { name: 'Educação', icon: '📚', type: 'EXPENSE', color: '#26A69A' },
  { name: 'Compras', icon: '🛍️', type: 'EXPENSE', color: '#EC407A' },
  { name: 'Contas & Serviços', icon: '📄', type: 'EXPENSE', color: '#78909C' },
  { name: 'Salário', icon: '💼', type: 'INCOME', color: '#66BB6A' },
  { name: 'Investimentos', icon: '📈', type: 'INCOME', color: '#2E7D32' },
  { name: 'Renda Extra', icon: '💰', type: 'INCOME', color: '#81C784' },
  { name: 'Outros', icon: '📦', type: 'EXPENSE', color: '#BDBDBD' },
];
