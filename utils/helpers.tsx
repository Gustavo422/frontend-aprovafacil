import { cloneDeep } from 'lodash-es';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import * as R from 'ramda';

// Exemplo: Clonar objeto profundamente
export function deepClone<T>(obj: T): T {
  return cloneDeep(obj);
}

// Exemplo: Atualizar estado imutável
export function updateState<T>(state: T, recipe: (draft: T) => void): T {
  return produce(state, recipe);
}

// Exemplo: Gerar IDs únicos
export function generateNanoId(): string {
  return nanoid();
}
export function generateUuid(): string {
  return uuidv4();
}

// Exemplo: Usar Ramda para mapear e filtrar
export function filterAndMap<T, U>(arr: T[], filterFn: (item: T) => boolean, mapFn: (item: T) => U): U[] {
  return R.pipe(R.filter(filterFn), R.map(mapFn))(arr);
} 