import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Priority, Task } from '../../core/models';
import { ProjectService } from '../../core/services/project.service';
import { SettingsService } from '../../core/services/settings.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { isOverdue, isUpcoming } from '../../core/utils/date.utils';
import { PRIORITY_OPTIONS, PRIORITY_WEIGHT } from '../../core/utils/labels';
import { EmptyState } from '../../shared/components/empty-state';
import { PageHeader } from '../../shared/components/page-header';
import { TaskBoard } from './task-board';
import { TaskTable } from './task-table';

type ViewMode = 'board' | 'list';
type DueFilter = '' | 'overdue' | 'upcoming' | 'none';
const VIEW_KEY = 'sm.tasksView';

@Component({
  selector: 'app-tasks-page',
  imports: [RouterLink, PageHeader, EmptyState, TaskBoard, TaskTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks-page.html',
  styleUrl: './tasks.scss',
})
export class TasksPage {
  private readonly taskService = inject(TaskService);
  private readonly settings = inject(SettingsService);
  protected readonly projects = inject(ProjectService);
  protected readonly subjects = inject(SubjectService);

  protected readonly priorityOptions = PRIORITY_OPTIONS;

  protected readonly view = signal<ViewMode>(this.loadView());
  protected readonly search = signal('');
  protected readonly projectId = signal('');
  protected readonly subjectId = signal('');
  protected readonly priority = signal<Priority | ''>('');
  protected readonly due = signal<DueFilter>('');

  protected readonly hasTasks = computed(() => this.taskService.items().length > 0);
  protected readonly hasFilters = computed(
    () => !!(this.search() || this.projectId() || this.subjectId() || this.priority() || this.due()),
  );

  protected readonly summary = computed(() => {
    const all = this.taskService.items();
    return {
      pending: all.filter((t) => t.status !== 'done').length,
      done: all.filter((t) => t.status === 'done').length,
      overdue: all.filter((t) => t.status !== 'done' && isOverdue(t.dueDate)).length,
    };
  });

  protected readonly filtered = computed<Task[]>(() => {
    const term = this.search().trim().toLowerCase();
    const projectId = this.projectId();
    const subjectId = this.subjectId();
    const priority = this.priority();
    const due = this.due();
    const upcomingDays = this.settings.settings().upcomingDays;

    return this.taskService
      .items()
      .filter((t) => {
        if (term && !t.title.toLowerCase().includes(term) && !t.description.toLowerCase().includes(term)) return false;
        if (projectId && (projectId === 'none' ? t.projectId !== null : t.projectId !== projectId)) return false;
        if (subjectId && (subjectId === 'none' ? t.subjectId !== null : t.subjectId !== subjectId)) return false;
        if (priority && t.priority !== priority) return false;
        if (due === 'overdue' && !(t.status !== 'done' && isOverdue(t.dueDate))) return false;
        if (due === 'upcoming' && !(t.status !== 'done' && isUpcoming(t.dueDate, upcomingDays))) return false;
        if (due === 'none' && t.dueDate) return false;
        return true;
      })
      .sort((a, b) => {
        const byDone = Number(a.status === 'done') - Number(b.status === 'done');
        if (byDone) return byDone;
        const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (byPriority) return byPriority;
        return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
      });
  });

  protected setView(view: ViewMode): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* preferência apenas local */
    }
  }

  protected clearFilters(): void {
    this.search.set('');
    this.projectId.set('');
    this.subjectId.set('');
    this.priority.set('');
    this.due.set('');
  }

  private loadView(): ViewMode {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board';
    } catch {
      return 'board';
    }
  }
}
