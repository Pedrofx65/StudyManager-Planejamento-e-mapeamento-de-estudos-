import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubjectService } from '../core/services/subject.service';
import { TimerService } from '../core/services/timer.service';
import { DurationPipe } from '../shared/pipes/duration.pipe';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, DatePipe, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <button type="button" class="btn btn-icon d-lg-none" aria-label="Abrir menu" (click)="menuToggle.emit()">
        <i class="bi bi-list fs-5"></i>
      </button>
      <div class="today d-none d-sm-block">{{ today | date: "EEEE, d 'de' MMMM" }}</div>

      <div class="ms-auto d-flex align-items-center gap-2">
        @if (timer.isActive()) {
          <div class="mini-timer" [class.paused]="timer.status() === 'paused'">
            <a routerLink="/timer" class="mini-timer-link" title="Abrir cronômetro">
              <span class="color-dot" [style.background]="subject()?.color ?? 'var(--sm-primary)'"></span>
              <span class="mini-subject truncate d-none d-md-inline">{{ subject()?.name ?? 'Estudo livre' }}</span>
              <span class="mini-clock">{{ timer.elapsedSeconds() | duration: 'clock' }}</span>
            </a>
            @if (timer.status() === 'running') {
              <button type="button" class="btn btn-icon btn-sm" aria-label="Pausar cronômetro" title="Pausar" (click)="timer.pause()">
                <i class="bi bi-pause-fill"></i>
              </button>
            } @else {
              <button type="button" class="btn btn-icon btn-sm" aria-label="Continuar cronômetro" title="Continuar" (click)="timer.resume()">
                <i class="bi bi-play-fill"></i>
              </button>
            }
          </div>
        } @else {
          <a routerLink="/timer" class="btn btn-ghost btn-sm">
            <i class="bi bi-play-circle me-1"></i><span class="d-none d-sm-inline">Iniciar estudo</span>
          </a>
        }
        <a routerLink="/tasks/new" class="btn btn-primary btn-sm">
          <i class="bi bi-plus-lg"></i><span class="d-none d-sm-inline ms-1">Nova tarefa</span>
        </a>
      </div>
    </header>
  `,
  styles: `
    .topbar {
      position: sticky; top: 0; z-index: 1020; display: flex; align-items: center; gap: 0.75rem;
      height: 60px; padding: 0 1.5rem; background: color-mix(in srgb, var(--sm-bg) 85%, transparent);
      backdrop-filter: blur(10px); border-bottom: 1px solid var(--sm-border);
    }
    @media (max-width: 575.98px) { .topbar { padding: 0 1rem; } }
    .today { color: var(--sm-text-muted); font-size: 0.85rem; }
    .today::first-letter { text-transform: uppercase; }
    .mini-timer { display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0.2rem 0.15rem 0.7rem; border-radius: 8px; background: var(--sm-success-soft); border: 1px solid transparent; }
    .mini-timer.paused { background: var(--sm-warning-soft); }
    .mini-timer-link { display: flex; align-items: center; gap: 0.5rem; color: var(--sm-text); font-size: 0.82rem; min-width: 0; }
    .mini-subject { max-width: 140px; color: var(--sm-text-muted); }
    .mini-clock { font-variant-numeric: tabular-nums; font-weight: 600; }
  `,
})
export class Topbar {
  readonly menuToggle = output<void>();
  protected readonly timer = inject(TimerService);
  private readonly subjects = inject(SubjectService);
  protected readonly today = new Date();
  protected readonly subject = computed(() => this.subjects.getById(this.timer.selection().subjectId));
}
