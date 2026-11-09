import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Barra de progresso fina com rótulo opcional. */
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb-wrap">
      <div
        class="pb-track"
        role="progressbar"
        [attr.aria-valuenow]="clamped()"
        aria-valuemin="0"
        aria-valuemax="100"
        [attr.aria-label]="label() || 'Progresso'"
      >
        <div class="pb-fill" [style.width.%]="clamped()" [style.background]="color() || null"></div>
      </div>
      @if (showValue()) {
        <span class="pb-value">{{ clamped() }}%</span>
      }
    </div>
  `,
  styles: `
    .pb-wrap { display: flex; align-items: center; gap: 0.6rem; }
    .pb-track { flex: 1; height: 6px; border-radius: 99px; background: var(--sm-surface-2); overflow: hidden; border: 1px solid var(--sm-border); }
    .pb-fill { height: 100%; background: var(--sm-primary); border-radius: 99px; transition: width 0.3s ease; }
    .pb-value { font-size: 0.75rem; color: var(--sm-text-muted); min-width: 2.4rem; text-align: right; font-variant-numeric: tabular-nums; }
  `,
})
export class ProgressBar {
  readonly value = input(0);
  readonly color = input<string | null>(null);
  readonly showValue = input(true);
  readonly label = input('');
  protected readonly clamped = computed(() => Math.round(Math.max(0, Math.min(100, this.value()))));
}
