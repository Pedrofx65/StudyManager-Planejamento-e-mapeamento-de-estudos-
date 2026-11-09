import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

/** Diálogo de confirmação baseado em Promise. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<ConfirmRequest | null>(null);
  readonly current = this.state.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    this.state()?.resolve(false);
    return new Promise<boolean>((resolve) => this.state.set({ ...options, resolve }));
  }

  /** Atalho para confirmações de exclusão. */
  confirmDelete(itemName: string, extra = ''): Promise<boolean> {
    return this.ask({
      title: 'Confirmar exclusão',
      message: `Deseja excluir "${itemName}"? ${extra}`.trim(),
      confirmLabel: 'Excluir',
      danger: true,
    });
  }

  close(result: boolean): void {
    const request = this.state();
    this.state.set(null);
    request?.resolve(result);
  }
}
