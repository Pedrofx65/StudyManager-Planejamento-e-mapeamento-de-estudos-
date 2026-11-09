import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/** Notificações rápidas exibidas no canto da tela. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly state = signal<Toast[]>([]);
  readonly toasts = this.state.asReadonly();

  show(message: string, type: ToastType = 'success', durationMs = 3500): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this.state.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error', 5000);
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  dismiss(id: number): void {
    this.state.update((list) => list.filter((t) => t.id !== id));
  }
}
