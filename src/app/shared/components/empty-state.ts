import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Mensagem exibida quando não há dados, com espaço para uma ação. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" [class.compact]="compact()">
      <div class="empty-icon"><i class="bi" [class]="icon()"></i></div>
      <div class="empty-title">{{ title() }}</div>
      @if (message()) {
        <p class="empty-message">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty { text-align: center; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; }
    .empty.compact { padding: 1.5rem 0.5rem; }
    .empty-icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; background: var(--sm-surface-2); border: 1px solid var(--sm-border); color: var(--sm-text-muted); font-size: 1.3rem; margin-bottom: 0.9rem; }
    .compact .empty-icon { width: 38px; height: 38px; font-size: 1.05rem; margin-bottom: 0.6rem; }
    .empty-title { font-weight: 600; margin-bottom: 0.25rem; }
    .empty-message { color: var(--sm-text-muted); font-size: 0.85rem; max-width: 380px; margin: 0 0 1rem; }
    .compact .empty-message { margin-bottom: 0.5rem; }
  `,
})
export class EmptyState {
  readonly icon = input('bi-inbox');
  readonly title = input.required<string>();
  readonly message = input('');
  readonly compact = input(false);
}
