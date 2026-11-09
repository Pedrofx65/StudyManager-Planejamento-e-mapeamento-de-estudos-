import { DateString, Entity, Priority } from './common.model';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task extends Entity {
  title: string;
  description: string;
  projectId: string | null;
  subjectId: string | null;
  dueDate: DateString | null;
  priority: Priority;
  status: TaskStatus;
  /** Tempo estimado em minutos. */
  estimatedMinutes: number;
  /** Tempo efetivamente utilizado em minutos. */
  spentMinutes: number;
  /** Posição dentro da coluna do Kanban. */
  order: number;
  completedAt: string | null;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'order' | 'completedAt'>;
