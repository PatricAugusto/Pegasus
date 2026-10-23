import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDateBR,
  formatShortDateBR,
  getMonthName,
} from '../../src/common/formatters';

describe('Common: Formatters', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor positivo corretamente em Real brasileiro (BRL)', () => {
      const formatted = formatCurrency(1234.56);
      // Remove espaços não-quebráveis (nbsp) para garantir comparação uniforme
      const normalized = formatted.replace(/\s/g, ' ');
      expect(normalized).toContain('1.234,56');
      expect(normalized).toContain('R$');
    });

    it('deve formatar zero corretamente', () => {
      const formatted = formatCurrency(0);
      const normalized = formatted.replace(/\s/g, ' ');
      expect(normalized).toContain('0,00');
    });

    it('deve formatar valores negativos', () => {
      const formatted = formatCurrency(-50.25);
      const normalized = formatted.replace(/\s/g, ' ');
      expect(normalized).toContain('50,25');
      expect(normalized).toContain('-');
    });
  });

  describe('formatDateBR', () => {
    it('deve formatar data completa em formato dia/mês/ano hora:minuto', () => {
      const date = new Date(2026, 9, 23, 14, 30); // 23 de Outubro de 2026 às 14:30
      const formatted = formatDateBR(date);
      expect(formatted).toMatch(/23\/10\/2026/);
      expect(formatted).toMatch(/14:30/);
    });
  });

  describe('formatShortDateBR', () => {
    it('deve formatar data abreviada apenas com dia e mês (DD/MM)', () => {
      const date = new Date(2026, 4, 15); // 15 de Maio
      const formatted = formatShortDateBR(date);
      expect(formatted).toBe('15/05');
    });
  });

  describe('getMonthName', () => {
    it('deve retornar o nome correto do mês por número (1 a 12)', () => {
      expect(getMonthName(1)).toBe('Janeiro');
      expect(getMonthName(2)).toBe('Fevereiro');
      expect(getMonthName(6)).toBe('Junho');
      expect(getMonthName(10)).toBe('Outubro');
      expect(getMonthName(12)).toBe('Dezembro');
    });

    it('deve retornar string vazia para mês inválido', () => {
      expect(getMonthName(0)).toBe('');
      expect(getMonthName(13)).toBe('');
      expect(getMonthName(-1)).toBe('');
    });
  });
});
