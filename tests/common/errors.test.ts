import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError } from '../../src/common/errors';

describe('Common: Errors', () => {
  it('AppError deve ter código de status padrão 400', () => {
    const error = new AppError('Erro de validação');
    expect(error.message).toBe('Erro de validação');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('AppError');
    expect(error instanceof Error).toBe(true);
  });

  it('AppError deve aceitar código de status customizado', () => {
    const error = new AppError('Não autorizado', 401);
    expect(error.statusCode).toBe(401);
  });

  it('NotFoundError deve ter código 404 e mensagem padrão', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Recurso não encontrado');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
  });

  it('NotFoundError deve aceitar mensagem personalizada', () => {
    const error = new NotFoundError('Transação não encontrada');
    expect(error.message).toBe('Transação não encontrada');
    expect(error.statusCode).toBe(404);
  });
});
