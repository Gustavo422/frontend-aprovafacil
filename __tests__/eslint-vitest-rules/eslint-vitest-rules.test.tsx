/**
 * Arquivo de teste com problemas conhecidos para verificar as regras do eslint-plugin-vitest
 * 
 * Este arquivo contém exemplos de código que violam as regras configuradas do eslint-plugin-vitest.
 * O objetivo é verificar se o ESLint detecta corretamente esses problemas.
 * 
 * IMPORTANTE: Este arquivo NÃO deve ser executado como parte dos testes normais.
 * Ele serve apenas para verificar a detecção de problemas pelo ESLint.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Regra: vitest/no-identical-title
// Problema: Títulos de teste duplicados
describe('Títulos duplicados', () => {
  it('este título está duplicado', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('este título está duplicado', () => {
    expect(2 + 2).toBe(4);
  });
});

// Regra: vitest/no-disabled-tests
// Problema: Testes desativados
describe.skip('Teste desativado', () => {
  it('este teste está em um describe desativado', () => {
    expect(true).toBe(true);
  });
});

it.skip('Este teste está desativado', () => {
  expect(true).toBe(true);
});

// Regra: vitest/no-focused-tests
// Problema: Testes focados
describe.only('Teste focado', () => {
  it('este teste está em um describe focado', () => {
    expect(true).toBe(true);
  });
});

it.only('Este teste está focado', () => {
  expect(true).toBe(true);
});

// Regra: vitest/expect-expect
// Problema: Teste sem asserção
it('teste sem asserção', () => {
  const resultado = 1 + 1;
  expect(resultado).toBe(2);
});

// Regra: vitest/valid-expect
// Problema: Uso inválido de expect
it('uso inválido de expect', () => {
  expect(true).toBe(true);
});

// Regra: vitest/prefer-to-be
// Problema: Uso de toEqual para tipos primitivos
it('deve usar toBe em vez de toEqual para primitivos', () => {
  expect(1).toEqual(1); // Deveria usar toBe
  expect('string').toEqual('string'); // Deveria usar toBe
  expect(true).toEqual(true); // Deveria usar toBe
});

// Regra: vitest/prefer-to-have-length
// Problema: Verificação manual de length
it('deve usar toHaveLength', () => {
  const array = [1, 2, 3];
  expect(array.length).toBe(3); // Deveria usar toHaveLength
});

// Regras específicas do frontend

// Regra: vitest/no-conditional-tests
// Problema: Testes condicionais
it('teste condicional', () => {
  if (process.env.NODE_ENV === 'development') {
    expect(true).toBe(true);
  }
});

// Regra: vitest/no-conditional-expect
// Problema: Asserções condicionais
it('asserção condicional', () => {
  const condition = Math.random() > 0.5;
  if (condition) {
    expect(true).toBe(true);
  }
});

// Regra: vitest/no-done-callback
// Problema: Uso de callback done
it('teste com callback done', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(true).toBe(true);
});

// Regra: vitest/no-standalone-expect
// Problema: Expect fora de um bloco de teste
expect(true).toBe(true);

describe('Testes com componentes React', () => {
  // Mais exemplos de problemas com testes de componentes React
  
  // Regra: vitest/expect-expect
  // Problema: Teste sem asserção em componente React
  it('renderiza componente sem asserção', () => {
    render(<div>Teste</div>);
    // Falta o expect()
  });
  
  // Regra: vitest/no-conditional-tests
  // Problema: Teste condicional com componente React
  it('teste condicional com componente', () => {
    const shouldRender = process.env.NODE_ENV === 'development';
    if (shouldRender) {
      render(<div>Teste</div>);
      expect(screen.getByText('Teste')).toBeInTheDocument();
    }
  });
});