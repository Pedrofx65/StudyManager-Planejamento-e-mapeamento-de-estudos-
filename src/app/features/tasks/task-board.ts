import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Router, RouterLink } from '@angular/router';
import { Task, TaskStatus } from '../../core/models';
import { TaskService } from '../../core/services/task.service';
import { isOverdue } from '../../core/utils/date.utils';
import { PriorityBadge } from '../../shared/components/badges';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { TaskActions } from './task-actions';

interface BoardColumn {
  status: TaskStatus;
  title: string;
  icon: string;
  tasks: Task[];
}

/** Quadro Kanban com arrastar e soltar (Angular CDK). */
@Component({
  selector: 'app-task-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, DatePipe, RouterLink, PriorityBadge, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-board.html',
  styleUrl: './tasks.scss',
})
export class TaskBoard {
  /** Tarefas já filtradas pela página. */
  readonly tasks = input.required<Task[]>();

  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  protected readonly actions = inject(TaskActions);

  protected readonly columns = computed<BoardColumn[]>(() => {
    const byStatus: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of this.tasks()) byStatus[t.status].push(t);
    for (const list of Object.values(byStatus)) list.sort((a, b) => a.order - b.order);
    return [
      { status: 'todo', title: 'A fazer', icon: 'bi-circle', tasks: byStatus.todo },
      { status: 'in_progress', title: 'Em andamento', icon: 'bi-circle-half', tasks: byStatus.in_progress },
      { status: 'done', title: 'Concluído', icon: 'bi-check-circle-fill', tasks: byStatus.done },
    ];
  });

  protected drop(event: CdkDragDrop<Task[], Task[], Task>, status: TaskStatus): void {
    const task = event.item.data;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;

    // Converte o índice da lista filtrada para o índice real da coluna.
    const visible = event.container.data.filter((t) => t.id !== task.id);
    const reference = visible[event.currentIndex];
    const fullColumn = this.taskService.board()[status].filter((t) => t.id !== task.id);
    const realIndex = reference ? fullColumn.findIndex((t) => t.id === reference.id) : fullColumn.length;

    this.taskService.move(task.id, status, realIndex);
  }

  protected open(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  protected isOverdue(task: Task): boolean {
    return task.status !== 'done' && isOverdue(task.dueDate);
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}
