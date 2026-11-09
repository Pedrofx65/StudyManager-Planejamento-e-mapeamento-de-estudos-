import { Signal, WritableSignal, inject, signal } from '@angular/core';
import { Entity } from '../models';
import { StorageKey, StorageService } from './storage.service';

/**
 * Base para os serviços de domínio: mantém uma coleção em um signal
 * e grava no LocalStorage a cada alteração.
 */
export abstract class EntityStore<T extends Entity> {
  protected readonly storage = inject(StorageService);
  private readonly state: WritableSignal<T[]>;

  /** Lista somente leitura e reativa das entidades. */
  readonly items: Signal<T[]>;

  protected constructor(private readonly key: StorageKey) {
    this.state = signal(this.load());
    this.items = this.state.asReadonly();
  }

  getById(id: string | null | undefined): T | undefined {
    if (!id) return undefined;
    return this.state().find((item) => item.id === id);
  }

  /** Recarrega do armazenamento (após importação ou limpeza dos dados). */
  reload(): void {
    this.state.set(this.load());
  }

  protected insert(item: T): T {
    this.commit([...this.state(), item]);
    return item;
  }

  protected patch(id: string, changes: Partial<T>): T | undefined {
    let updated: T | undefined;
    this.commit(
      this.state().map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...changes, id: item.id, createdAt: item.createdAt };
        return updated;
      }),
    );
    return updated;
  }

  protected removeById(id: string): void {
    this.commit(this.state().filter((item) => item.id !== id));
  }

  /** Atualiza vários itens de uma vez, gravando apenas uma vez. */
  protected mapAll(fn: (item: T) => T): void {
    this.commit(this.state().map(fn));
  }

  protected commit(items: T[]): void {
    this.state.set(items);
    this.storage.write(this.key, items);
  }

  private load(): T[] {
    const data = this.storage.read<T[]>(this.key, []);
    return Array.isArray(data) ? data : [];
  }
}
