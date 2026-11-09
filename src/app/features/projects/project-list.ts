import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Priority, Project, ProjectStatus } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProjectService } from '../../core/services/project.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { isOverdue, isUpcoming } from '../../core/utils/date.utils';
import { PRIORITY_OPTIONS, PRIORITY_WEIGHT, PROJECT_STATUS_OPTIONS } from '../../core/utils/labels';
import { PriorityBadge, StatusBadge } from '../../shared/components/badges';
import { EmptyState } from '../../shared/components/empty-state';
import { PageHeader } from '../../shared/components/page-header';
import { ProgressBar } from '../../shared/components/progress-bar';
import { RelativeDayPipe } from '../../shared/pipes/relative-day.pipe';

type SortKey = 'dueDate' | 'priority' | 'progress' | 'name';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, DatePipe, PageHeader, EmptyState, ProgressBar, PriorityBadge, StatusBadge, RelativeDayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list.html',
  styleUrl: './projects.scss',
})
export class ProjectList {
  private readonly projectService = inject(ProjectService);
  private readonly settings = inject(SettingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly statusOptions = PROJECT_STATUS_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;

  protected readonly search = signal('');
  protected readonly status = signal<ProjectStatus | ''>('');
  protected readonly priority = signal<Priority | ''>('');
  protected readonly sort = signal<SortKey>('dueDate');

  protected readonly hasProjects = computed(() => this.projectService.items().length > 0);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const priority = this.priority();
    const progress = this.projectService.progressMap();
    const upcomingDays = this.settings.settings().upcomingDays;

    const list = this.projectService
      .items()
      .filter(
        (p) =>
          (!status || p.status === status) &&
          (!priority || p.priority === priority) &&
          (!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)),
      )
      .map((project) => {
        const open = project.status !== 'completed';
        return {
          project,
          progress: progress.get(project.id) ?? { total: 0, done: 0, progress: 0 },
          overdue: open && isOverdue(project.dueDate),
          upcoming: open && isUpcoming(project.dueDate, upcomingDays),
        };
      });

    const sort = this.sort();
    return list.sort((a, b) => {
      switch (sort) {
        case 'priority':
          return PRIORITY_WEIGHT[b.project.priority] - PRIORITY_WEIGHT[a.project.priority];
        case 'progress':
          return b.progress.progress - a.progress.progress;
        case 'name':
          return a.project.name.localeCompare(b.project.name, 'pt-BR');
        default:
          return a.project.dueDate.localeCompare(b.project.dueDate);
      }
    });
  });

  protected open(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  protected async remove(project: Project, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.confirmDelete(project.name, 'As tarefas e sessões vinculadas serão mantidas, mas ficarão sem projeto.');
    if (!ok) return;
    this.projectService.delete(project.id);
    this.toast.success('Projeto excluído.');
  }

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.priority.set('');
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}
