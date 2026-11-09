import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

/** Diálogo modal controlado pelo ConfirmService (instanciado uma vez no layout). */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (confirm.current(); as request) {
      <div class="backdrop" (click)="confirm.close(false)"></div>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="dialog-icon" [class.danger]="request.danger">
          <i class="bi" [class]="request.danger ? 'bi-exclamation-triangle' : 'bi-question-circle'"></i>
        </div>
        <h2 id="confirm-title" class="dialog-title">{{ request.title }}</h2>
        <p class="dialog-message">{{ request.message }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-ghost" (click)="confirm.close(false)">
            {{ request.cancelLabel ?? 'Cancelar' }}
          </button>
          <button
            #confirmButton
            type="button"
            class="btn"
            [class]="request.danger ? 'btn-danger' : 'btn-primary'"
            (click)="confirm.close(true)"
          >
            {{ request.confirmLabel ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 1080; animation: fade 0.15s ease; }
    .dialog {
      position: fixed; z-index: 1081; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(420px, calc(100vw - 2rem)); background: var(--sm-surface); border: 1px solid var(--sm-border);
      border-radius: 12px; padding: 1.4rem; box-shadow: var(--sm-shadow); animation: pop 0.15s ease;
    }
    .dialog-icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; font-size: 1.15rem; background: var(--sm-primary-soft); color: var(--sm-primary); margin-bottom: 0.9rem; }
    .dialog-icon.danger { background: var(--sm-danger-soft); color: var(--sm-danger); }
    .dialog-title { font-size: 1.05rem; margin: 0 0 0.4rem; }
    .dialog-message { color: var(--sm-text-muted); font-size: 0.875rem; margin: 0 0 1.25rem; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translate(-50%, -48%); } }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    // Foca o botão principal ao abrir, para acessibilidade via teclado.
    effect(() => this.confirmButton()?.nativeElement.focus());
  }

  protected onEscape(): void {
    if (this.confirm.current()) this.confirm.close(false);
  }
}
