import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card de indicador numérico (usado no dashboard). */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sm-card stat">
      <div class="stat-icon" [class]="'tone-' + tone()"><i class="bi" [class]="icon()"></i></div>
      <div class="min-w-0">
        <div class="stat-label">{{ label() }}</div>
        <div class="stat-value">{{ value() }}</div>
        @if (hint()) {
          <div class="stat-hint">{{ hint() }}</div>
        }
      </div>
    </div>
  `,
  styles: `
    .stat { display: flex; gap: 0.9rem; align-items: flex-start; height: 100%; }
    .stat-icon { width: 38px; height: 38px; border-radius: 9px; display: grid; place-items: center; font-size: 1.05rem; flex-shrink: 0; }
    .tone-primary { background: var(--sm-primary-soft); color: var(--sm-primary); }
    .tone-success { background: var(--sm-success-soft); color: var(--sm-success); }
    .tone-warning { background: var(--sm-warning-soft); color: var(--sm-warning); }
    .tone-danger { background: var(--sm-danger-soft); color: var(--sm-danger); }
    .stat-label { font-size: 0.78rem; color: var(--sm-text-muted); }
    .stat-value { font-size: 1.45rem; font-weight: 600; line-height: 1.25; letter-spacing: -0.02em; }
    .stat-hint { font-size: 0.72rem; color: var(--sm-text-subtle); margin-top: 0.15rem; }
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('bi-bar-chart');
  readonly hint = input('');
  readonly tone = input<'primary' | 'success' | 'warning' | 'danger'>('primary');
}
