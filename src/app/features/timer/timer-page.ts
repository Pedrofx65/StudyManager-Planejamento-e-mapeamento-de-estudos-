import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { TimerService } from '../../core/services/timer.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDuration, startOfWeek, toDateString } from '../../core/utils/date.utils';
import { EmptyState } from '../../shared/components/empty-state';
import { PageHeader } from '../../shared/components/page-header';
import { ProgressBar } from '../../shared/components/progress-bar';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-timer-page',
  imports: [RouterLink, DatePipe, PageHeader, EmptyState, ProgressBar, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './timer-page.html',
  styleUrl: './timer-page.scss',
})
export class TimerPage {
  protected readonly timer = inject(TimerService);
  protected readonly subjects = inject(SubjectService);
  protected readonly projects = inject(ProjectService);
  private readonly tasks = inject(TaskService);
  private readonly sessions = inject(SessionService);
  private readonly settings = inject(SettingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly selectedSubject = computed(() => this.subjects.getById(this.timer.selection().subjectId));

  /** Tarefas pendentes compatíveis com o projeto/matéria selecionados. */
  protected readonly availableTasks = computed(() => {
    const { projectId, subjectId, taskId } = this.timer.selection();
    return this.tasks
      .items()
      .filter(
        (t) =>
          t.id === taskId ||
          (t.status !== 'done' && (!projectId || t.projectId === projectId) && (!subjectId || t.subjectId === subjectId)),
      );
  });

  protected readonly todaySessions = computed(() => {
    const today = toDateString(new Date());
    return this.sessions.sorted().filter((s) => toDateString(new Date(s.start)) === today);
  });

  protected readonly todaySeconds = computed(() => this.todaySessions().reduce((sum, s) => sum + s.durationSeconds, 0));

  protected readonly weekSeconds = computed(() => {
    const start = startOfWeek(new Date()).getTime();
    return this.sessions.items().filter((s) => new Date(s.start).getTime() >= start).reduce((sum, s) => sum + s.durationSeconds, 0);
  });

  protected readonly weeklyGoalHours = computed(() => this.settings.settings().weeklyGoalHours);
  protected readonly weekProgress = computed(() => {
    const goal = this.weeklyGoalHours();
    return goal > 0 ? ((this.weekSeconds() + (this.timer.isActive() ? this.timer.elapsedSeconds() : 0)) / 3600 / goal) * 100 : 0;
  });

  protected readonly recentSessions = computed(() => this.sessions.sorted().slice(0, 8));

  protected subjectName(id: string | null): string {
    return this.subjects.getById(id)?.name ?? 'Sem matéria';
  }

  protected subjectColor(id: string | null): string {
    return this.subjects.getById(id)?.color ?? 'var(--sm-text-subtle)';
  }

  protected selectSubject(value: string): void {
    const subjectId = value || null;
    const task = this.tasks.getById(this.timer.selection().taskId);
    // Mantém a tarefa só se ela pertencer à nova matéria.
    const keepTask = task && (!subjectId || task.subjectId === subjectId);
    this.timer.setSelection({ subjectId, taskId: keepTask ? task.id : null });
  }

  protected selectProject(value: string): void {
    const projectId = value || null;
    const task = this.tasks.getById(this.timer.selection().taskId);
    const keepTask = task && (!projectId || task.projectId === projectId);
    this.timer.setSelection({ projectId, taskId: keepTask ? task.id : null });
  }

  /** Ao escolher uma tarefa, preenche projeto e matéria dela automaticamente. */
  protected selectTask(value: string): void {
    const task = this.tasks.getById(value);
    if (!task) {
      this.timer.setSelection({ taskId: null });
      return;
    }
    this.timer.setSelection({
      taskId: task.id,
      projectId: task.projectId ?? this.timer.selection().projectId,
      subjectId: task.subjectId ?? this.timer.selection().subjectId,
    });
  }

  protected start(): void {
    this.timer.start();
    const taskId = this.timer.selection().taskId;
    const task = this.tasks.getById(taskId);
    if (task?.status === 'todo') this.tasks.setStatus(task.id, 'in_progress');
  }

  protected finish(): void {
    const session = this.timer.finish();
    if (session) {
      this.toast.success(`Sessão de ${formatDuration(session.durationSeconds)} registrada.`);
    } else {
      this.toast.info('Sessão muito curta: nada foi registrado.');
    }
  }

  protected async discard(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Descartar sessão',
      message: 'O tempo desta sessão não será registrado. Deseja continuar?',
      confirmLabel: 'Descartar',
      danger: true,
    });
    if (ok) {
      this.timer.discard();
      this.toast.info('Sessão descartada.');
    }
  }
}
