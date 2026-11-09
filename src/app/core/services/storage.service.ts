import { Injectable } from '@angular/core';

/** Chaves usadas no LocalStorage (todas recebem o prefixo `sm.`). */
export const STORAGE_KEYS = {
  projects: 'projects',
  tasks: 'tasks',
  subjects: 'subjects',
  sessions: 'sessions',
  events: 'events',
  settings: 'settings',
  timer: 'timer',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Único ponto de acesso ao LocalStorage.
 * Para trocar a persistência por uma API no futuro, basta alterar esta camada
 * e os serviços de domínio.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'sm.';

  read<T>(key: StorageKey, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  write<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Não foi possível salvar "${key}" no LocalStorage.`, error);
    }
  }

  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* armazenamento indisponível */
    }
  }

  /** Lê todas as chaves conhecidas (usado no backup). */
  readAll(): Partial<Record<StorageKey, unknown>> {
    const data: Partial<Record<StorageKey, unknown>> = {};
    for (const key of Object.values(STORAGE_KEYS)) {
      const value = this.read<unknown>(key, null);
      if (value !== null) data[key] = value;
    }
    return data;
  }

  clearAll(): void {
    for (const key of Object.values(STORAGE_KEYS)) this.remove(key);
  }
}
