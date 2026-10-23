/**
 * Utilitários de sanitização e proteção contra ataques de injeção e DoS
 */

/**
 * Escapa caracteres reservados do Markdown do Telegram para prevenir erros 400 e quebras de formatação
 */
export function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Sanitiza strings removendo caracteres de controle perigosos e truncando para tamanho seguro
 */
export function sanitizeString(text: string, maxLength: number = 255): string {
  if (!text) return '';
  // Remove caracteres nulos e de controle ASCII (exceto quebras de linha e tabulações comuns)
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Garante que um valor numérico esteja dentro de limites seguros contra estouro de memória
 */
export function clampSafeInteger(
  value: number,
  min: number = 1,
  max: number = 100,
  defaultValue?: number
): number {
  if (isNaN(value) || !isFinite(value)) {
    return defaultValue !== undefined ? defaultValue : min;
  }
  return Math.min(Math.max(min, Math.floor(value)), max);
}
