import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../core/services/settings.service';
import { TaskService } from '../core/services/task.service';
import { TimerService } from '../core/services/timer.service';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar" [class.open]="open()" aria-label="Navegação principal">
      <div class="brand">
        <div class="brand-logo"><i class="bi bi-mortarboard-fill"></i></div>
        <div class="min-w-0">
          <div class="brand-name">Study Manager</div>
          <div class="brand-user truncate">{{ greeting() }}</div>
        </div>
        <button type="button" class="btn btn-icon ms-auto d-lg-none" aria-label="Fechar menu" (click)="closed.emit()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <nav class="nav-list">
        <div class="small-caps nav-section">Menu</div>
        @for (item of items; track item.path) {
          <a
            class="nav-link-item"
            [routerLink]="item.path"
            routerLinkActive="active"
            ariaCurrentWhenActive="page"
            (click)="closed.emit()"
          >
            <i class="bi" [class]="item.icon"></i>
            <span class="flex-grow-1">{{ item.label }}</span>
            @if (item.path === '/tasks' && pendingCount() > 0) {
              <span class="nav-count">{{ pendingCount() }}</span>
            }
            @if (item.path === '/timer' && timer.isActive()) {
              <span class="live-dot" [class.paused]="timer.status() === 'paused'" title="Sessão ativa"></span>
            }
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="nav-link-item w-100" (click)="settings.toggleTheme()">
          <i class="bi" [class]="settings.settings().theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'"></i>
          <span>{{ settings.settings().theme === 'dark' ? 'Tema claro' : 'Tema escuro' }}</span>
        </button>
      </div>
    </aside>
  `,
  styles: `
    .sidebar {
      position: fixed; inset: 0 auto 0 0; width: var(--sm-sidebar-width); z-index: 1040;
      display: flex; flex-direction: column; background: var(--sm-surface); border-right: 1px solid var(--sm-border);
      padding: calc(1rem + env(safe-area-inset-top, 0px)) 0.75rem calc(1rem + env(safe-area-inset-bottom, 0px));
      transition: transform 0.22s ease;
    }
    @media (max-width: 991.98px) {
      .sidebar { transform: translateX(-100%); box-shadow: var(--sm-shadow); }
      .sidebar.open { transform: translateX(0); }
    }
    .brand { display: flex; align-items: center; gap: 0.65rem; padding: 0 0.5rem 1.25rem; }
    .brand-logo { width: 34px; height: 34px; border-radius: 9px; background: var(--sm-primary); color: #fff; display: grid; place-items: center; font-size: 1rem; flex-shrink: 0; }
    .brand-name { font-weight: 700; font-size: 0.95rem; letter-spacing: -0.01em; }
    .brand-user { font-size: 0.75rem; color: var(--sm-text-muted); }
    .nav-section { padding: 0 0.6rem 0.5rem; }
    .nav-list { display: flex; flex-direction: column; gap: 2px; flex: 1; overflow-y: auto; }
    .nav-link-item {
      display: flex; align-items: center; gap: 0.7rem; padding: 0.5rem 0.6rem; border-radius: 7px;
      color: var(--sm-text-muted); font-size: 0.875rem; font-weight: 500; background: none; border: 0; text-align: left;
      transition: background 0.12s, color 0.12s;
    }
    .nav-link-item > .bi { font-size: 1rem; width: 1.1rem; text-align: center; }
    .nav-link-item:hover { background: var(--sm-surface-hover); color: var(--sm-text); }
    .nav-link-item.active { background: var(--sm-primary-soft); color: var(--sm-primary); }
    .nav-count { font-size: 0.7rem; background: var(--sm-surface-2); border: 1px solid var(--sm-border); color: var(--sm-text-muted); border-radius: 99px; padding: 0.05rem 0.45rem; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sm-success); box-shadow: 0 0 0 3px var(--sm-success-soft); animation: pulse 1.5s infinite; }
    .live-dot.paused { background: var(--sm-warning); box-shadow: 0 0 0 3px var(--sm-warning-soft); animation: none; }
    .sidebar-footer { border-top: 1px solid var(--sm-border); padding-top: 0.75rem; }
    @keyframes pulse { 50% { opacity: 0.4; } }
  `,
})
export class Sidebar {
  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly settings = inject(SettingsService);
  protected readonly timer = inject(TimerService);
  private readonly tasks = inject(TaskService);

  protected readonly items = NAV_ITEMS;
  protected readonly pendingCount = computed(() => this.tasks.pending().length);
  protected readonly greeting = computed(() => {
    const name = this.settings.settings().userName.trim();
    return name ? `Olá, ${name}` : 'Seus estudos, organizados';
  });
}
