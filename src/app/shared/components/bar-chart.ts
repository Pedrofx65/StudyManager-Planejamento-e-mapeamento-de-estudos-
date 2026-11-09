import {
  ChangeDetectionStrategy,
  DestroyRef,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';
import { SettingsService } from '../../core/services/settings.service';

// Registra apenas o necessário (tree-shaking).
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

/**
 * Gráfico de barras (vertical ou horizontal) com tooltip e tabela acessível.
 * Cores de texto/grade vêm das variáveis CSS do tema atual.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-box" [style.height.px]="computedHeight()">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
    <table class="visually-hidden">
      <caption>{{ ariaLabel() }}</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Valor</th></tr></thead>
      <tbody>
        @for (label of labels(); track $index) {
          <tr><td>{{ label }}</td><td>{{ format()(values()[$index]) }}</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: `.chart-box { position: relative; width: 100%; }`,
})
export class BarChart {
  readonly labels = input.required<string[]>();
  readonly values = input.required<number[]>();
  /** Uma cor para todas as barras ou uma por barra. */
  readonly colors = input<string | string[]>('#3987e5');
  readonly horizontal = input(false);
  readonly height = input(240);
  readonly ariaLabel = input('Gráfico');
  /** Formata valores no tooltip, no eixo e na tabela acessível. */
  readonly format = input<(value: number) => string>((v) => String(v));
  /** Destaca uma barra (índice) mantendo as demais mais suaves. */
  readonly highlightIndex = input<number | null>(null);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly settings = inject(SettingsService);
  private chart: Chart<'bar'> | null = null;

  /** Barras horizontais crescem com a quantidade de itens. */
  protected readonly computedHeight = computed(() =>
    this.horizontal() ? Math.max(120, this.labels().length * 34 + 30) : this.height(),
  );

  constructor() {
    afterRenderEffect(() => {
      const theme = this.settings.settings().theme; // re-renderiza ao trocar o tema
      const labels = this.labels();
      const values = this.values();
      const horizontal = this.horizontal();
      const format = this.format();
      const highlight = this.highlightIndex();
      const baseColors = this.colors();

      const css = getComputedStyle(document.documentElement);
      const token = (name: string): string => css.getPropertyValue(name).trim();
      const text = token('--sm-text-muted');
      const grid = token('--sm-border');
      const surface = token('--sm-surface');

      const colors = labels.map((_, i) => {
        const color = Array.isArray(baseColors) ? (baseColors[i] ?? '#3987e5') : baseColors;
        return highlight === null || highlight === i ? color : `${color}8c`;
      });

      this.chart?.destroy();
      this.chart = new Chart(this.canvas().nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors,
              hoverBackgroundColor: colors.map((c) => c.slice(0, 7)),
              borderRadius: 4,
              borderSkipped: 'start',
              maxBarThickness: horizontal ? 18 : 28,
              categoryPercentage: 0.7,
              barPercentage: 0.9,
            },
          ],
        },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 300 },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: surface,
              titleColor: token('--sm-text'),
              bodyColor: token('--sm-text'),
              borderColor: token('--sm-border-strong'),
              borderWidth: 1,
              padding: 10,
              cornerRadius: 8,
              displayColors: true,
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              callbacks: { label: (ctx) => ` ${format(Number(horizontal ? ctx.parsed.x : ctx.parsed.y))}` },
            },
          },
          scales: {
            [horizontal ? 'y' : 'x']: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: text, font: { size: 11 } },
            },
            [horizontal ? 'x' : 'y']: {
              beginAtZero: true,
              grid: { color: grid, drawTicks: false },
              border: { display: false },
              ticks: { color: text, font: { size: 11 }, padding: 8, maxTicksLimit: 5, callback: (v) => format(Number(v)) },
            },
          },
        },
      });
      void theme;
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
