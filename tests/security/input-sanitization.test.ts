import { describe, it, expect } from 'vitest';
import {
  escapeMarkdown,
  sanitizeString,
  clampSafeInteger,
} from '../../src/common/sanitizer';

describe('Security Suite: Sanitization & Defensive Programming', () => {
  describe('escapeMarkdown', () => {
    it('deve escapar adequadamente caracteres reservados do Markdown do Telegram', () => {
      const input = 'Almoço *especial* com [amigos] & _parceiros_ `código`';
      const escaped = escapeMarkdown(input);

      expect(escaped).toContain('\\*especial\\*');
      expect(escaped).toContain('\\[amigos\\]');
      expect(escaped).toContain('\\_parceiros\\_');
      expect(escaped).toContain('\\`código\\`');
    });

    it('deve tratar strings vazias ou nulas com segurança', () => {
      expect(escapeMarkdown('')).toBe('');
      expect(escapeMarkdown(null as any)).toBe('');
    });
  });

  describe('sanitizeString', () => {
    it('deve remover caracteres nulos e bytes de controle maliciosos', () => {
      const malicious = 'Mercado\x00\x08\x1B\x7F Central';
      const clean = sanitizeString(malicious);
      expect(clean).toBe('Mercado Central');
    });

    it('deve truncar strings que excedem o tamanho máximo permitido', () => {
      const longString = 'A'.repeat(500);
      const truncated = sanitizeString(longString, 100);
      expect(truncated.length).toBe(100);
    });

    it('deve fazer trim de espaços em branco nas extremidades', () => {
      expect(sanitizeString('   Padaria Real   ')).toBe('Padaria Real');
    });
  });

  describe('clampSafeInteger', () => {
    it('deve limitar valores dentro dos limites mínimos e máximos', () => {
      expect(clampSafeInteger(50, 1, 100)).toBe(50);
      expect(clampSafeInteger(-10, 1, 100)).toBe(1);
      expect(clampSafeInteger(5000, 1, 100)).toBe(100);
    });

    it('deve tratar NaN, -Infinity e +Infinity retornando o valor mínimo seguro', () => {
      expect(clampSafeInteger(NaN, 5, 50)).toBe(5);
      expect(clampSafeInteger(Infinity, 5, 50)).toBe(5);
      expect(clampSafeInteger(-Infinity, 5, 50)).toBe(5);
    });

    it('deve truncar decimais para inteiros', () => {
      expect(clampSafeInteger(15.9, 1, 100)).toBe(15);
    });
  });
});
