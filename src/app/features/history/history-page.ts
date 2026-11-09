import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudySession } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { addDays, toDateString } from '../../core/utils/date.utils';
import { EmptyState } from '../../shared/components/empty-state';
import { PageHeader } from '../../shared/components/page-header';
import { StatCard } from '../../shared/components/stat-card';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

type Period = 'all' | '7' | '30' | 'month' | 'custom';

@Component({
  selector: 'app-history-page',
  imports: [RouterLink, DatePipe, PageHeader, EmptyState, StatCard, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './history-page.html',
  styleUrl: './history.scss',
})
export class HistoryPage implements OnInit {
  /** Filtro inicial via query param (?subject=id ou ?project=id). */
  readonly subject = input<string>();
  readonly project = input<string>();

  private readonly sessions = inject(SessionService);
  private readonly tasks = inject(TaskService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly subjects = inject(SubjectService);
  protected readonly projects = inject(ProjectService);

  protected readonly subjectId = signal('');
  protected readonly projectId = signal('');
  protected readonly period = signal<Period>('all');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly expandedId = signal<string | null>(null);

  protected readonly hasSessions = computed(() => this.sessions.items().length > 0);
  protected readonly hasFilters = computed(() => !!(this.subjectId() || this.projectId() || this.period() !== 'all'));

  /** Intervalo [início, fim] em YYYY-MM-DD de acordo com o período escolhido. */
  private readonly range = computed<[string, string] | null>(() => {
    const today = new Date();
    switch (this.period()) {
      case '7':
        return [toDateString(addDays(today, -6)), toDateString(today)];
      case '30':
        return [toDateString(addDays(today, -29)), toDateString(today)];
      case 'month':
        return [toDateString(new Date(today.getFullYear(), today.getMonth(), 1)), toDateString(today)];
      case 'custom':
        return [this.from() || '0000-01-01', this.to() || '9999-12-31'];
      default:
        return null;
    }
  });

  protected readonly filtered = computed(() => {
    const subjectId = this.subjectId();
    const projectId = this.projectId();
    const range = this.range();
    return this.sessions.sorted().filter((s) => {
      if (subjectId && (subjectId === 'none' ? s.subjectId !== null : s.subjectId !== subjectId)) return false;
      if (projectId && (projectId === 'none' ? s.projectId !== null : s.projectId !== projectId)) return false;
      if (range) {
        const day = toDateString(new Date(s.start));
        if (day < range[0] || day > range[1]) return false;
      }
      return true;
    });
  });

  protected readonly totals = computed(() => {
    const list = this.filtered();
    const seconds = list.reduce((sum, s) => sum + s.durationSeconds, 0);
    const days = new Set(list.map((s) => toDateString(new Date(s.start)))).size;
    return { seconds, count: list.length, average: list.length ? seconds / list.length : 0, days };
  });

  ngOnInit(): void {
    if (this.subjects.getById(this.subject())) this.subjectId.set(this.subject()!);
    if (this.projects.getById(this.project())) this.projectId.set(this.project()!);
  }

  protected subjectOf(session: StudySession) {
    return this.subjects.getById(session.subjectId);
  }

  protected projectName(session: StudySession): string {
    return this.projects.getById(session.projectId)?.name ?? '—';
  }

  protected taskTitle(session: StudySession): string | null {
    return this.tasks.getById(session.taskId)?.title ?? null;
  }

  protected toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  protected setPeriod(value: Period): void {
    this.period.set(value);
    if (value === 'custom' && !this.from()) {
      this.from.set(toDateString(addDays(new Date(), -30)));
      this.to.set(toDateString(new Date()));
    }
  }

  protected clearFilters(): void {
    this.subjectId.set('');
    this.projectId.set('');
    this.period.set('all');
  }

  protected async remove(session: StudySession): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir sessão',
      message: 'Esta sessão será removida do histórico e o tempo será descontado da tarefa vinculada.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    this.sessions.delete(session.id);
    this.toast.success('Sessão excluída.');
  }
}
