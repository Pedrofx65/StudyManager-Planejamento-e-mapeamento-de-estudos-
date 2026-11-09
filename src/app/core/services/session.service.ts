import { Injectable, computed, inject } from '@angular/core';
import { StudySession, StudySessionInput } from '../models';
import { generateId } from '../utils/id.utils';
import { EntityStore } from './entity-store';
import { STORAGE_KEYS } from './storage.service';
import { TaskService } from './task.service';

const toMinutes = (seconds: number): number => Math.round(seconds / 60);

/** Sessões de estudo (cronômetro e registros manuais). */
@Injectable({ providedIn: 'root' })
export class SessionService extends EntityStore<StudySession> {
  private readonly tasks = inject(TaskService);

  constructor() {
    super(STORAGE_KEYS.sessions);
  }

  /** Mais recentes primeiro. */
  readonly sorted = computed(() => [...this.items()].sort((a, b) => b.start.localeCompare(a.start)));

  readonly totalSeconds = computed(() => this.items().reduce((sum, s) => sum + s.durationSeconds, 0));

  readonly secondsBySubject = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.items()) {
      if (s.subjectId) map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.durationSeconds);
    }
    return map;
  });

  readonly secondsByProject = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.items()) {
      if (s.projectId) map.set(s.projectId, (map.get(s.projectId) ?? 0) + s.durationSeconds);
    }
    return map;
  });

  /** Registra a sessão e soma o tempo na tarefa vinculada. */
  add(input: StudySessionInput): StudySession {
    const session = this.insert({ ...input, id: generateId(), createdAt: new Date().toISOString() });
    this.tasks.addSpentMinutes(session.taskId, toMinutes(session.durationSeconds));
    return session;
  }

  /** Atualiza a sessão mantendo o tempo das tarefas consistente. */
  update(id: string, input: StudySessionInput): StudySession | undefined {
    const previous = this.getById(id);
    if (!previous) return undefined;
    this.tasks.addSpentMinutes(previous.taskId, -toMinutes(previous.durationSeconds));
    const updated = this.patch(id, input);
    if (updated) this.tasks.addSpentMinutes(updated.taskId, toMinutes(updated.durationSeconds));
    return updated;
  }

  delete(id: string): void {
    const session = this.getById(id);
    if (!session) return;
    this.tasks.addSpentMinutes(session.taskId, -toMinutes(session.durationSeconds));
    this.removeById(id);
  }

  unlinkProject(projectId: string): void {
    this.mapAll((s) => (s.projectId === projectId ? { ...s, projectId: null } : s));
  }

  unlinkSubject(subjectId: string): void {
    this.mapAll((s) => (s.subjectId === subjectId ? { ...s, subjectId: null } : s));
  }

  unlinkTask(taskId: string): void {
    this.mapAll((s) => (s.taskId === taskId ? { ...s, taskId: null } : s));
  }
}
