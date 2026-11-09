import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Task } from '../../core/models';
import { CalendarService } from '../../core/services/calendar.service';
import { DataService } from '../../core/services/data.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { addDays, daysUntil, formatDuration, isOverdue, startOfWeek } from '../../core/utils/date.utils';
import { CALENDAR_KIND_META } from '../../core/utils/labels';
import { PriorityBadge } from '../../shared/components/badges';
import { BarChart } from '../../shared/components/bar-chart';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressBar } from '../../shared/components/progress-bar';
import { StatCard } from '../../shared/components/stat-card';
import { RelativeDayPipe } from '../../shared/pipes/relative-day.pipe';

const WEEKS = 8;
const MAX_SUBJECT_BARS = 7;
const OTHER_COLOR = '#8b93a1';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, StatCard, BarChart, EmptyState, ProgressBar, PriorityBadge, RelativeDayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly projects = inject(ProjectService);
  private readonly tasks = inject(TaskService);
  private readonly subjects = inject(SubjectService);
  private readonly sessions = inject(SessionService);
  private readonly calendar = inject(CalendarService);
  private readonly settings = inject(SettingsService);
  private readonly data = inject(DataService);
  private readonly toast = inject(ToastService);

  protected readonly meta = CALENDAR_KIND_META;
  protected readonly formatHours = (hours: number): string => formatDuration(hours * 3600);
  protected readonly axisHours = (hours: number): string => `${hours}h`;

  protected readonly hasData = computed(() =>
    this.projects.items().length + this.tasks.items().length + this.subjects.items().length + this.sessions.items().length > 0,
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const base = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = this.settings.settings().userName.trim();
    return name ? `${base}, ${name}` : base;
  });

  // --- Indicadores -------------------------------------------------------------

  protected readonly stats = computed(() => ({
    projects: this.projects.items().length,
    activeProjects: this.projects.items().filter((p) => p.status === 'in_progress').length,
    pending: this.tasks.pending().length,
    overdue: this.tasks.pending().filter((t) => isOverdue(t.dueDate)).length,
    done: this.tasks.completed().length,
    subjectsInProgress: this.subjects.inProgress().length,
    subjects: this.subjects.items().length,
    totalSeconds: this.sessions.totalSeconds(),
    sessions: this.sessions.items().length,
    progress: this.subjects.overallProgress(),
  }));

  // --- Gráfico: horas por semana -------------------------------------------------

  protected readonly weekly = computed(() => {
    const thisWeek = startOfWeek(new Date());
    const starts = Array.from({ length: WEEKS }, (_, i) => addDays(thisWeek, (i - WEEKS + 1) * 7));
    const totals = new Array<number>(WEEKS).fill(0);
    const first = starts[0].getTime();
    for (const s of this.sessions.items()) {
      const t = new Date(s.start).getTime();
      if (t < first) continue;
      const index = Math.min(WEEKS - 1, Math.floor((t - first) / (7 * 86_400_000)));
      totals[index] += s.durationSeconds / 3600;
    }
    const labels = starts.map((d, i) =>
      i === WEEKS - 1 ? 'Atual' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    );
    const values = totals.map((h) => Math.round(h * 100) / 100);
    const average = values.slice(0, -1).reduce((a, b) => a + b, 0) / (WEEKS - 1);
    return { labels, values, current: values[WEEKS - 1], average };
  });

  protected readonly weeklyGoal = computed(() => this.settings.settings().weeklyGoalHours);

  // --- Gráfico: distribuição por matéria ------------------------------------------

  protected readonly bySubject = computed(() => {
    const studied = this.subjects
      .stats()
      .filter((s) => s.studiedSeconds > 0)
      .sort((a, b) => b.studiedSeconds - a.studiedSeconds);
    const total = this.sessions.totalSeconds();
    const top = studied.slice(0, MAX_SUBJECT_BARS);
    const topSeconds = top.reduce((sum, s) => sum + s.studiedSeconds, 0);
    const rest = total - topSeconds;

    const labels = top.map((s) => s.subject.name);
    const values = top.map((s) => s.studiedSeconds / 3600);
    const colors = top.map((s) => s.subject.color);
    if (rest > 59) {
      labels.push(studied.length > MAX_SUBJECT_BARS ? 'Outras / sem matéria' : 'Sem matéria');
      values.push(rest / 3600);
      colors.push(OTHER_COLOR);
    }
    return { labels, values: values.map((v) => Math.round(v * 100) / 100), colors };
  });

  // --- Listas ------------------------------------------------------------------

  protected readonly deadlines = computed(() => {
    const days = this.settings.settings().upcomingDays;
    return this.calendar
      .openDeadlines()
      .filter((i) => i.overdue || daysUntil(i.date) <= days)
      .slice(0, 6);
  });

  protected readonly priorityTasks = computed(() => this.tasks.prioritized().slice(0, 5));

  protected readonly subjectProgress = computed(() =>
    [...this.subjects.stats()].sort((a, b) => b.studiedSeconds - a.studiedSeconds).slice(0, 5),
  );

  protected projectName(task: Task): string | null {
    return this.projects.getById(task.projectId)?.name ?? null;
  }

  protected isTaskOverdue(task: Task): boolean {
    return isOverdue(task.dueDate);
  }

  protected completeTask(task: Task): void {
    this.tasks.setStatus(task.id, 'done');
    this.toast.success('Tarefa concluída.');
  }

  protected loadDemo(): void {
    this.data.loadDemo();
    this.toast.success('Dados de demonstração carregados.');
  }
}
