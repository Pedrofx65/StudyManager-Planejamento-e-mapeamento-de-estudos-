import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Task } from '../../core/models';
import { isOverdue } from '../../core/utils/date.utils';
import { PriorityBadge, StatusBadge } from '../../shared/components/badges';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { TaskActions } from './task-actions';

/** Visão em lista (tabela) das tarefas. */
@Component({
  selector: 'app-task-table',
  imports: [DatePipe, RouterLink, PriorityBadge, StatusBadge, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sm-card p-0">
      <div class="sm-table-wrap">
        <table class="sm-table">
          <thead>
            <tr>
              <th style="width: 2.5rem"><span class="visually-hidden">Concluída</span></th>
              <th>Tarefa</th>
              <th>Matéria</th>
              <th>Prazo</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Tempo</th>
              <th class="text-end"><span class="visually-hidden">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.id) {
              <tr>
                <td>
                  <input class="form-check-input" type="checkbox" [checked]="task.status === 'done'" (change)="actions.toggleDone(task)" [attr.aria-label]="'Concluir ' + task.title" />
                </td>
                <td style="min-width: 220px">
                  <a class="fw-500 text-reset" [class.done-text]="task.status === 'done'" [routerLink]="['/tasks', task.id, 'edit']">{{ task.title }}</a>
                  @if (actions.projectOf(task); as project) {
                    <div class="text-subtle small"><i class="bi bi-folder2 me-1"></i>{{ project.name }}</div>
                  }
                </td>
                <td>
                  @if (actions.subjectOf(task); as subject) {
                    <span class="sm-chip"><span class="color-dot" [style.background]="subject.color"></span>{{ subject.name }}</span>
                  } @else {
                    <span class="text-subtle">—</span>
                  }
                </td>
                <td class="text-nowrap" [class.text-danger-sm]="isOverdue(task)">
                  {{ task.dueDate ? (task.dueDate | date: 'dd/MM/yyyy') : '—' }}
                </td>
                <td><app-priority-badge [value]="task.priority" /></td>
                <td><app-status-badge [value]="task.status" /></td>
                <td class="text-nowrap text-muted">{{ task.spentMinutes | duration: 'minutes' }} / {{ task.estimatedMinutes | duration: 'minutes' }}</td>
                <td class="text-end text-nowrap">
                  @if (task.status !== 'done') {
                    <button type="button" class="btn btn-icon btn-sm" title="Estudar esta tarefa" aria-label="Estudar esta tarefa" (click)="actions.study(task)"><i class="bi bi-play-fill"></i></button>
                  }
                  <a class="btn btn-icon btn-sm" [routerLink]="['/tasks', task.id, 'edit']" title="Editar" aria-label="Editar tarefa"><i class="bi bi-pencil"></i></a>
                  <button type="button" class="btn btn-icon btn-sm danger" title="Excluir" aria-label="Excluir tarefa" (click)="actions.delete(task)"><i class="bi bi-trash"></i></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `.done-text { color: var(--sm-text-subtle) !important; text-decoration: line-through; }`,
})
export class TaskTable {
  readonly tasks = input.required<Task[]>();
  protected readonly actions = inject(TaskActions);

  protected isOverdue(task: Task): boolean {
    return task.status !== 'done' && isOverdue(task.dueDate);
  }
}
