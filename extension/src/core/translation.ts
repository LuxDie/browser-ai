/**
 * Funciones auxiliares para el núcleo de traducción
 * Estas funciones encapsulan la lógica de traducción utilizada en la implementación
 */

import { vi } from 'vitest';

/**
 * Crea un mock para el almacenamiento de Chrome
 * @param initialData - Datos iniciales
 * @returns Mock del almacenamiento
 */
export const createStorageMock = (initialData: Record<string, unknown> = {}) => {
  let data = { ...initialData };
  
  return {
    get: vi.fn().mockImplementation((keys?: string | string[] | Record<string, unknown>) => {
      if (!keys) return Promise.resolve(data);
      if (typeof keys === 'string') return Promise.resolve({ [keys]: data[keys] });
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        keys.forEach(key => {
          result[key] = data[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(data);
    }),
    set: vi.fn().mockImplementation((items: Record<string, unknown>) => {
      data = { ...data, ...items };
      return Promise.resolve();
    }),
    remove: vi.fn().mockImplementation((keys: string | string[]) => {
      if (typeof keys === 'string') {
        delete data[keys];
      } else {
        keys.forEach(key => delete data[key]);
      }
      return Promise.resolve();
    }),
  };
};
