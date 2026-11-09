import { Injectable, computed, inject } from '@angular/core';
import { Project, ProjectInput } from '../models';
import { generateId } from '../utils/id.utils';
import { EntityStore } from './entity-store';
import { SessionService } from './session.service';
import { STORAGE_KEYS } from './storage.service';
import { TaskService } from './task.service';

export interface ProjectProgress {
  total: number;
  done: number;
  /** Percentual 0–100. */
  progress: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService extends EntityStore<Project> {
  private readonly tasks = inject(TaskService);
  private readonly sessions = inject(SessionService);

  constructor() {
    super(STORAGE_KEYS.projects);
  }

  /** Ordenados pela data prevista de conclusão. */
  readonly sorted = computed(() => [...this.items()].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));

  /**
   * Progresso calculado automaticamente: % de tarefas concluídas.
   * Projeto sem tarefas: 100% se marcado como concluído, senão 0%.
   */
  readonly progressMap = computed(() => {
    const map = new Map<string, ProjectProgress>();
    for (const project of this.items()) map.set(project.id, { total: 0, done: 0, progress: 0 });
    for (const task of this.tasks.items()) {
      const entry = task.projectId ? map.get(task.projectId) : undefined;
      if (!entry) continue;
      entry.total++;
      if (task.status === 'done') entry.done++;
    }
    for (const project of this.items()) {
      const entry = map.get(project.id)!;
      entry.progress = entry.total
        ? Math.round((entry.done / entry.total) * 100)
        : project.status === 'completed' ? 100 : 0;
    }
    return map;
  });

  progressOf(id: string): ProjectProgress {
    return this.progressMap().get(id) ?? { total: 0, done: 0, progress: 0 };
  }

  create(input: ProjectInput): Project {
    return this.insert({ ...input, id: generateId(), createdAt: new Date().toISOString() });
  }

  update(id: string, input: Partial<ProjectInput>): Project | undefined {
    return this.patch(id, input);
  }

  /** Exclui o projeto mantendo tarefas e sessões (apenas desvincula). */
  delete(id: string): void {
    this.tasks.unlinkProject(id);
    this.sessions.unlinkProject(id);
    this.removeById(id);
  }
}
