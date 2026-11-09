import { DateString, Entity, Priority } from './common.model';

export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';

export interface Project extends Entity {
  name: string;
  description: string;
  startDate: DateString;
  dueDate: DateString;
  status: ProjectStatus;
  priority: Priority;
}

export type ProjectInput = Omit<Project, 'id' | 'createdAt'>;
