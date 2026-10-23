import { describe, it, expect } from 'vitest';

describe('Modules: Bot Command Parsing & Logic', () => {
  // Função pura que replica a lógica de extração do comando /gasto e /receita
  function parseTransactionCommand(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    const parts = trimmed.match(/^([0-9]+[.,]?[0-9]*)\s+(.+)$/);
    if (!parts) return null;

    const rawAmount = parts[1].replace(',', '.');
    const amount = parseFloat(rawAmount);

    if (isNaN(amount) || amount <= 0) return null;

    const descriptionAndCategory = parts[2].trim();
    const words = descriptionAndCategory.split(' ');

    return {
      amount,
      rawAmount,
      descriptionAndCategory,
      words,
    };
  }

  it('deve extrair valor com ponto decimal e descrição', () => {
    const parsed = parseTransactionCommand('35.50 Almoço no Restaurante');
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(35.5);
    expect(parsed?.descriptionAndCategory).toBe('Almoço no Restaurante');
  });

  it('deve aceitar valores com vírgula e normalizar para ponto flutuante', () => {
    const parsed = parseTransactionCommand('12,75 Padaria');
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(12.75);
    expect(parsed?.descriptionAndCategory).toBe('Padaria');
  });

  it('deve aceitar números inteiros sem decimais', () => {
    const parsed = parseTransactionCommand('150 Presente');
    expect(parsed).not.toBeNull();
    expect(parsed?.amount).toBe(150);
    expect(parsed?.descriptionAndCategory).toBe('Presente');
  });

  it('deve rejeitar entradas sem descrição', () => {
    const parsed = parseTransactionCommand('50.00');
    expect(parsed).toBeNull();
  });

  it('deve rejeitar valores não numéricos', () => {
    const parsed = parseTransactionCommand('abc Almoço');
    expect(parsed).toBeNull();
  });

  it('deve rejeitar valores zerados', () => {
    const parsed = parseTransactionCommand('0 Café');
    expect(parsed).toBeNull();
  });
});
