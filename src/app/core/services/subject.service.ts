import { Injectable, computed, inject } from '@angular/core';
import { Subject, SubjectInput, SubjectStats } from '../models';
import { generateId } from '../utils/id.utils';
import { CalendarEventService } from './calendar-event.service';
import { EntityStore } from './entity-store';
import { SessionService } from './session.service';
import { STORAGE_KEYS } from './storage.service';
import { TaskService } from './task.service';

@Injectable({ providedIn: 'root' })
export class SubjectService extends EntityStore<Subject> {
  private readonly sessions = inject(SessionService);
  private readonly tasks = inject(TaskService);
  private readonly events = inject(CalendarEventService);

  constructor() {
    super(STORAGE_KEYS.subjects);
  }

  readonly sorted = computed(() => [...this.items()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));

  /**
   * Indicadores de cada matéria.
   * Percentual de conclusão:
   *  - com conteúdos cadastrados → % de conteúdos concluídos;
   *  - sem conteúdos → horas estudadas ÷ horas planejadas (máx. 100%).
   */
  readonly stats = computed<SubjectStats[]>(() => {
    const seconds = this.sessions.secondsBySubject();
    return this.sorted().map((subject) => {
      const studiedSeconds = seconds.get(subject.id) ?? 0;
      const topicsDone = subject.topics.filter((t) => t.done).length;
      let progress = 0;
      if (subject.topics.length) {
        progress = (topicsDone / subject.topics.length) * 100;
      } else if (subject.plannedHours > 0) {
        progress = Math.min(100, (studiedSeconds / 3600 / subject.plannedHours) * 100);
      }
      return { subject, studiedSeconds, topicsDone, progress: Math.round(progress) };
    });
  });

  /** Matérias iniciadas e ainda não concluídas. */
  readonly inProgress = computed(() =>
    this.stats().filter((s) => s.progress < 100 && (s.studiedSeconds > 0 || s.topicsDone > 0)),
  );

  /** Progresso geral: média das matérias ponderada pelas horas planejadas. */
  readonly overallProgress = computed(() => {
    const stats = this.stats();
    if (!stats.length) return 0;
    const weights = stats.map((s) => Math.max(1, s.subject.plannedHours));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weighted = stats.reduce((sum, s, i) => sum + s.progress * weights[i], 0);
    return Math.round(weighted / totalWeight);
  });

  statsOf(id: string): SubjectStats | undefined {
    return this.stats().find((s) => s.subject.id === id);
  }

  create(input: SubjectInput, topics: string[] = []): Subject {
    return this.insert({
      ...input,
      id: generateId(),
      createdAt: new Date().toISOString(),
      topics: topics.map((title) => ({ id: generateId(), title, done: false })),
    });
  }

  update(id: string, input: Partial<SubjectInput>): Subject | undefined {
    return this.patch(id, input);
  }

  delete(id: string): void {
    this.tasks.unlinkSubject(id);
    this.sessions.unlinkSubject(id);
    this.events.unlinkSubject(id);
    this.removeById(id);
  }

  // --- Conteúdos -------------------------------------------------------------

  addTopic(subjectId: string, title: string): void {
    const subject = this.getById(subjectId);
    const clean = title.trim();
    if (!subject || !clean) return;
    this.patch(subjectId, { topics: [...subject.topics, { id: generateId(), title: clean, done: false }] });
  }

  toggleTopic(subjectId: string, topicId: string): void {
    const subject = this.getById(subjectId);
    if (!subject) return;
    this.patch(subjectId, {
      topics: subject.topics.map((t) => (t.id === topicId ? { ...t, done: !t.done } : t)),
    });
  }

  renameTopic(subjectId: string, topicId: string, title: string): void {
    const subject = this.getById(subjectId);
    const clean = title.trim();
    if (!subject || !clean) return;
    this.patch(subjectId, {
      topics: subject.topics.map((t) => (t.id === topicId ? { ...t, title: clean } : t)),
    });
  }

  removeTopic(subjectId: string, topicId: string): void {
    const subject = this.getById(subjectId);
    if (!subject) return;
    this.patch(subjectId, { topics: subject.topics.filter((t) => t.id !== topicId) });
  }
}
