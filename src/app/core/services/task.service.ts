import { Injectable, computed } from '@angular/core';
import { Task, TaskInput, TaskStatus } from '../models';
import { generateId } from '../utils/id.utils';
import { PRIORITY_WEIGHT } from '../utils/labels';
import { EntityStore } from './entity-store';
import { STORAGE_KEYS } from './storage.service';

@Injectable({ providedIn: 'root' })
export class TaskService extends EntityStore<Task> {
  constructor() {
    super(STORAGE_KEYS.tasks);
  }

  readonly pending = computed(() => this.items().filter((t) => t.status !== 'done'));
  readonly completed = computed(() => this.items().filter((t) => t.status === 'done'));

  /** Tarefas agrupadas por status e ordenadas pela posição no Kanban. */
  readonly board = computed<Record<TaskStatus, Task[]>>(() => {
    const board: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const task of this.items()) board[task.status].push(task);
    for (const list of Object.values(board)) list.sort((a, b) => a.order - b.order);
    return board;
  });

  /** Pendentes ordenadas por prioridade e prazo. */
  readonly prioritized = computed(() =>
    [...this.pending()].sort((a, b) => {
      const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (byPriority !== 0) return byPriority;
      return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31');
    }),
  );

  byProject(projectId: string): Task[] {
    return this.items().filter((t) => t.projectId === projectId);
  }

  create(input: TaskInput): Task {
    return this.insert({
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      order: this.nextOrder(input.status),
      completedAt: input.status === 'done' ? new Date().toISOString() : null,
    });
  }

  update(id: string, input: Partial<TaskInput>): Task | undefined {
    const current = this.getById(id);
    if (!current) return undefined;
    const changes: Partial<Task> = { ...input };
    if (input.status && input.status !== current.status) {
      changes.order = this.nextOrder(input.status);
      changes.completedAt = input.status === 'done' ? new Date().toISOString() : null;
    }
    return this.patch(id, changes);
  }

  setStatus(id: string, status: TaskStatus): void {
    this.update(id, { status });
  }

  /**
   * Move a tarefa para uma coluna e posição (usado pelo Kanban).
   * Reorganiza a ordem de todas as tarefas da coluna de destino.
   */
  move(id: string, status: TaskStatus, index: number): void {
    const task = this.getById(id);
    if (!task) return;
    const column = this.board()[status].filter((t) => t.id !== id);
    const position = Math.max(0, Math.min(index, column.length));
    column.splice(position, 0, task);
    const orders = new Map(column.map((t, i) => [t.id, i]));
    const now = new Date().toISOString();

    this.mapAll((t) => {
      const order = orders.get(t.id);
      if (order === undefined) return t;
      if (t.id !== id) return { ...t, order };
      const statusChanged = t.status !== status;
      return {
        ...t,
        order,
        status,
        completedAt: statusChanged ? (status === 'done' ? now : null) : t.completedAt,
      };
    });
  }

  addSpentMinutes(id: string | null, minutes: number): void {
    const task = this.getById(id);
    if (!task || minutes === 0) return;
    this.patch(task.id, { spentMinutes: Math.max(0, task.spentMinutes + minutes) });
  }

  delete(id: string): void {
    this.removeById(id);
  }

  unlinkProject(projectId: string): void {
    this.mapAll((t) => (t.projectId === projectId ? { ...t, projectId: null } : t));
  }

  unlinkSubject(subjectId: string): void {
    this.mapAll((t) => (t.subjectId === subjectId ? { ...t, subjectId: null } : t));
  }

  private nextOrder(status: TaskStatus): number {
    const column = this.board()[status];
    return column.length ? Math.max(...column.map((t) => t.order)) + 1 : 0;
  }
}
