import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cabeçalho padrão das páginas, com área para ações à direita. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="min-w-0">
        <h1 class="page-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .page-title { font-size: 1.5rem; margin: 0; }
    .page-subtitle { margin: 0.3rem 0 0; color: var(--sm-text-muted); font-size: 0.875rem; }
    .page-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
