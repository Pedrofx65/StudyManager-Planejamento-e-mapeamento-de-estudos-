import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="toast.type" role="status">
          <i
            class="bi"
            [class]="toast.type === 'success' ? 'bi-check-circle-fill' : toast.type === 'error' ? 'bi-x-circle-fill' : 'bi-info-circle-fill'"
          ></i>
          <span class="flex-grow-1">{{ toast.message }}</span>
          <button type="button" class="btn btn-icon btn-sm" aria-label="Fechar" (click)="toastService.dismiss(toast.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; z-index: 1090; display: flex; flex-direction: column; gap: 0.5rem; width: min(360px, calc(100vw - 2rem)); }
    .toast-item {
      display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 0.65rem 0.65rem 0.9rem;
      background: var(--sm-surface-2); border: 1px solid var(--sm-border-strong); border-radius: 10px;
      box-shadow: var(--sm-shadow); font-size: 0.85rem; animation: slide 0.2s ease;
    }
    .success > .bi { color: var(--sm-success); }
    .error > .bi { color: var(--sm-danger); }
    .info > .bi { color: var(--sm-primary); }
    @keyframes slide { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
