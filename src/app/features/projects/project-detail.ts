import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectStatus, Task } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { daysUntil, isOverdue } from '../../core/utils/date.utils';
import { PRIORITY_WEIGHT, PROJECT_STATUS_OPTIONS } from '../../core/utils/labels';
import { PriorityBadge, StatusBadge } from '../../shared/components/badges';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressBar } from '../../shared/components/progress-bar';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, DatePipe, ProgressBar, EmptyState, PriorityBadge, StatusBadge, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail.html',
  styleUrl: './projects.scss',
})
export class ProjectDetail {
  readonly id = input.required<string>();

  private readonly projects = inject(ProjectService);
  private readonly tasks = inject(TaskService);
  private readonly sessions = inject(SessionService);
  private readonly subjects = inject(SubjectService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly statusOptions = PROJECT_STATUS_OPTIONS;

  protected readonly project = computed(() => this.projects.items().find((p) => p.id === this.id()));
  protected readonly progress = computed(() => this.projects.progressOf(this.id()));
  protected readonly studiedSeconds = computed(() => this.sessions.secondsByProject().get(this.id()) ?? 0);

  protected readonly daysLeft = computed(() => {
    const p = this.project();
    return p ? daysUntil(p.dueDate) : 0;
  });

  protected readonly projectTasks = computed(() =>
    this.tasks
      .items()
      .filter((t) => t.projectId === this.id())
      .sort((a, b) => {
        const byDone = Number(a.status === 'done') - Number(b.status === 'done');
        if (byDone !== 0) return byDone;
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }),
  );

  protected subjectOf(task: Task) {
    return this.subjects.getById(task.subjectId);
  }

  protected isTaskOverdue(task: Task): boolean {
    return task.status !== 'done' && isOverdue(task.dueDate);
  }

  protected toggleTask(task: Task): void {
    this.tasks.setStatus(task.id, task.status === 'done' ? 'todo' : 'done');
  }

  protected changeStatus(status: ProjectStatus): void {
    this.projects.update(this.id(), { status });
    this.toast.success('Status do projeto atualizado.');
  }

  protected async remove(): Promise<void> {
    const project = this.project();
    if (!project) return;
    const ok = await this.confirm.confirmDelete(project.name, 'As tarefas e sessões vinculadas serão mantidas, mas ficarão sem projeto.');
    if (!ok) return;
    this.projects.delete(project.id);
    this.toast.success('Projeto excluído.');
    this.router.navigate(['/projects']);
  }
}
