import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { StudySession } from '../models';
import { SessionService } from './session.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerSelection {
  subjectId: string | null;
  projectId: string | null;
  taskId: string | null;
}

interface TimerState extends TimerSelection {
  status: TimerStatus;
  /** Início da sessão (ISO). */
  startedAt: string | null;
  /** Timestamp (ms) do início do trecho atual em execução. */
  segmentStartedAt: number | null;
  /** Tempo acumulado dos trechos anteriores (ms). */
  accumulatedMs: number;
}

const IDLE_STATE: TimerState = {
  status: 'idle',
  startedAt: null,
  segmentStartedAt: null,
  accumulatedMs: 0,
  subjectId: null,
  projectId: null,
  taskId: null,
};

/**
 * Cronômetro global (singleton).
 * O tempo é sempre calculado a partir de timestamps salvos, então continua
 * correto ao navegar entre páginas, recarregar ou fechar a aba.
 */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly storage = inject(StorageService);
  private readonly sessions = inject(SessionService);

  private readonly state = signal<TimerState>({
    ...IDLE_STATE,
    ...this.storage.read<Partial<TimerState>>(STORAGE_KEYS.timer, {}),
  });
  private readonly now = signal(Date.now());
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly status = computed(() => this.state().status);
  readonly isActive = computed(() => this.state().status !== 'idle');
  readonly startedAt = computed(() => this.state().startedAt);
  readonly selection = computed<TimerSelection>(() => {
    const { subjectId, projectId, taskId } = this.state();
    return { subjectId, projectId, taskId };
  });

  readonly elapsedSeconds = computed(() => {
    const s = this.state();
    const running = s.status === 'running' && s.segmentStartedAt ? this.now() - s.segmentStartedAt : 0;
    return Math.floor((s.accumulatedMs + Math.max(0, running)) / 1000);
  });

  constructor() {
    if (this.state().status === 'running') this.startTicking();
    const onVisible = (): void => this.now.set(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      this.stopTicking();
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  /** Atualiza matéria/projeto/tarefa (permitido também durante a sessão). */
  setSelection(selection: Partial<TimerSelection>): void {
    this.setState({ ...this.state(), ...selection });
  }

  start(selection?: Partial<TimerSelection>): void {
    if (this.state().status !== 'idle') return;
    const now = Date.now();
    this.setState({
      ...this.state(),
      ...selection,
      status: 'running',
      startedAt: new Date(now).toISOString(),
      segmentStartedAt: now,
      accumulatedMs: 0,
    });
    this.startTicking();
  }

  pause(): void {
    const s = this.state();
    if (s.status !== 'running' || s.segmentStartedAt === null) return;
    this.setState({
      ...s,
      status: 'paused',
      accumulatedMs: s.accumulatedMs + (Date.now() - s.segmentStartedAt),
      segmentStartedAt: null,
    });
    this.stopTicking();
  }

  resume(): void {
    if (this.state().status !== 'paused') return;
    this.setState({ ...this.state(), status: 'running', segmentStartedAt: Date.now() });
    this.startTicking();
  }

  /** Finaliza e registra a sessão. Retorna null se não houver tempo contado. */
  finish(details: { content: string; notes: string }): StudySession | null {
    const s = this.state();
    if (s.status === 'idle' || !s.startedAt) return null;
    const duration = this.elapsedSeconds();
    const selection = this.selection();
    this.reset(selection);
    if (duration < 1) return null;

    return this.sessions.add({
      ...selection,
      start: s.startedAt,
      end: new Date().toISOString(),
      durationSeconds: duration,
      content: details.content.trim(),
      notes: details.notes.trim(),
      source: 'timer',
    });
  }

  /** Descarta a sessão atual sem registrar. */
  discard(): void {
    this.reset(this.selection());
  }

  private reset(keepSelection: TimerSelection): void {
    this.stopTicking();
    this.setState({ ...IDLE_STATE, ...keepSelection });
  }

  private setState(next: TimerState): void {
    this.state.set(next);
    this.now.set(Date.now());
    this.storage.write(STORAGE_KEYS.timer, next);
  }

  private startTicking(): void {
    this.stopTicking();
    this.intervalId = setInterval(() => this.now.set(Date.now()), 1000);
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
