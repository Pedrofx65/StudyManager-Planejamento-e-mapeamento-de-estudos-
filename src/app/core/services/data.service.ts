import { Injectable, inject } from '@angular/core';
import {
  CalendarEvent,
  Priority,
  Project,
  ProjectStatus,
  StudySession,
  Subject,
  Task,
  TaskStatus,
} from '../models';
import { addDays, startOfDay, toDateString } from '../utils/date.utils';
import { generateId } from '../utils/id.utils';
import { SUBJECT_COLORS } from '../utils/labels';
import { CalendarEventService } from './calendar-event.service';
import { ProjectService } from './project.service';
import { SessionService } from './session.service';
import { SettingsService } from './settings.service';
import { STORAGE_KEYS, StorageKey, StorageService } from './storage.service';
import { SubjectService } from './subject.service';
import { TaskService } from './task.service';

export interface BackupFile {
  app: 'study-manager';
  version: 1;
  exportedAt: string;
  data: Partial<Record<StorageKey, unknown>>;
}

const ARRAY_KEYS: StorageKey[] = [
  STORAGE_KEYS.projects,
  STORAGE_KEYS.tasks,
  STORAGE_KEYS.subjects,
  STORAGE_KEYS.sessions,
  STORAGE_KEYS.events,
];

/** Backup, importação, limpeza e dados de demonstração. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly storage = inject(StorageService);
  private readonly projects = inject(ProjectService);
  private readonly tasks = inject(TaskService);
  private readonly subjects = inject(SubjectService);
  private readonly sessions = inject(SessionService);
  private readonly events = inject(CalendarEventService);
  private readonly settings = inject(SettingsService);

  hasAnyData(): boolean {
    return (
      this.projects.items().length + this.tasks.items().length + this.subjects.items().length +
        this.sessions.items().length + this.events.items().length > 0
    );
  }

  exportBackup(): BackupFile {
    const data = this.storage.readAll();
    delete data[STORAGE_KEYS.timer];
    return { app: 'study-manager', version: 1, exportedAt: new Date().toISOString(), data };
  }

  /** Valida e importa um backup, substituindo os dados atuais. */
  importBackup(raw: unknown): void {
    if (!raw || typeof raw !== 'object' || (raw as BackupFile).app !== 'study-manager') {
      throw new Error('Arquivo inválido: não é um backup do Study Manager.');
    }
    const data = (raw as BackupFile).data;
    if (!data || typeof data !== 'object') throw new Error('Backup sem dados.');
    for (const key of ARRAY_KEYS) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        throw new Error(`Backup corrompido: "${key}" deveria ser uma lista.`);
      }
    }
    for (const key of ARRAY_KEYS) this.storage.write(key, data[key] ?? []);
    if (data[STORAGE_KEYS.settings] && typeof data[STORAGE_KEYS.settings] === 'object') {
      this.storage.write(STORAGE_KEYS.settings, data[STORAGE_KEYS.settings]);
    }
    this.reloadAll();
  }

  /** Apaga projetos, tarefas, matérias, sessões e eventos (mantém configurações). */
  clearAll(): void {
    for (const key of ARRAY_KEYS) this.storage.remove(key);
    this.reloadAll();
  }

  /** Substitui os dados atuais por um conjunto de demonstração. */
  loadDemo(): void {
    const demo = buildDemoData();
    this.storage.write(STORAGE_KEYS.subjects, demo.subjects);
    this.storage.write(STORAGE_KEYS.projects, demo.projects);
    this.storage.write(STORAGE_KEYS.tasks, demo.tasks);
    this.storage.write(STORAGE_KEYS.sessions, demo.sessions);
    this.storage.write(STORAGE_KEYS.events, demo.events);
    this.reloadAll();
  }

  private reloadAll(): void {
    this.projects.reload();
    this.tasks.reload();
    this.subjects.reload();
    this.sessions.reload();
    this.events.reload();
    this.settings.reload();
  }
}

// ---------------------------------------------------------------------------
// Dados de demonstração (datas relativas a hoje)
// ---------------------------------------------------------------------------

function buildDemoData(): {
  subjects: Subject[];
  projects: Project[];
  tasks: Task[];
  sessions: StudySession[];
  events: CalendarEvent[];
} {
  const now = new Date().toISOString();
  const today = startOfDay(new Date());
  const day = (offset: number): string => toDateString(addDays(today, offset));

  const subject = (name: string, category: string, color: string, plannedHours: number, topics: [string, boolean][], description = ''): Subject => ({
    id: generateId(),
    createdAt: now,
    name,
    description,
    category,
    color,
    plannedHours,
    topics: topics.map(([title, done]) => ({ id: generateId(), title, done })),
  });

  const portugues = subject('Português', 'Concursos', SUBJECT_COLORS[0], 40, [
    ['Interpretação de texto', true], ['Concordância verbal e nominal', true], ['Regência', false], ['Crase', false], ['Pontuação', false],
  ]);
  const constitucional = subject('Direito Constitucional', 'Concursos', SUBJECT_COLORS[1], 50, [
    ['Princípios fundamentais', true], ['Direitos e garantias fundamentais', true], ['Organização do Estado', false], ['Controle de constitucionalidade', false],
  ]);
  const administrativo = subject('Direito Administrativo', 'Concursos', SUBJECT_COLORS[2], 45, [
    ['Princípios da administração', true], ['Atos administrativos', false], ['Licitações', false], ['Improbidade', false],
  ]);
  const java = subject('Java', 'Programação', SUBJECT_COLORS[3], 60, [
    ['Orientação a objetos', true], ['Collections', true], ['Streams e lambdas', false], ['Exceptions', true], ['JDBC', false],
  ], 'Preparação para a certificação Oracle.');
  const angular = subject('Angular', 'Programação', SUBJECT_COLORS[4], 40, [
    ['Componentes e templates', true], ['Signals', true], ['Roteamento', false], ['Reactive Forms', false], ['Testes', false],
  ]);
  const banco = subject('Banco de Dados', 'Programação', SUBJECT_COLORS[5], 30, [
    ['Modelagem relacional', true], ['SQL básico', true], ['Joins', false], ['Índices e performance', false],
  ]);
  const subjects = [portugues, constitucional, administrativo, java, angular, banco];

  const project = (name: string, description: string, start: number, due: number, status: ProjectStatus, priority: Priority): Project => ({
    id: generateId(), createdAt: now, name, description, startDate: day(start), dueDate: day(due), status, priority,
  });
  const concursos = project('Preparação para concursos', 'Edital de analista — foco em Português e Direito.', -45, 75, 'in_progress', 'high');
  const programacao = project('Estudos de programação', 'Aprofundar Angular e banco de dados para projetos pessoais.', -30, 60, 'in_progress', 'medium');
  const certificacao = project('Certificação Java (OCP)', 'Estudar para a prova Oracle Certified Professional.', -10, 100, 'not_started', 'medium');
  const projects = [concursos, programacao, certificacao];

  let order = 0;
  const task = (
    title: string, p: Project, s: Subject, due: number | null, priority: Priority, status: TaskStatus, estimated: number, spent: number, description = '',
  ): Task => ({
    id: generateId(), createdAt: now, title, description, projectId: p.id, subjectId: s.id,
    dueDate: due === null ? null : day(due), priority, status, estimatedMinutes: estimated, spentMinutes: spent,
    order: order++, completedAt: status === 'done' ? now : null,
  });
  const tasks: Task[] = [
    task('Resolver 40 questões de interpretação', concursos, portugues, 2, 'high', 'in_progress', 120, 45),
    task('Resumo de concordância', concursos, portugues, -5, 'medium', 'done', 60, 70),
    task('Revisar direitos fundamentais (art. 5º)', concursos, constitucional, 4, 'high', 'todo', 180, 0),
    task('Mapa mental: organização do Estado', concursos, constitucional, -2, 'medium', 'todo', 90, 0),
    task('Estudar atos administrativos', concursos, administrativo, 6, 'high', 'todo', 150, 0),
    task('Simulado de Direito Administrativo', concursos, administrativo, 12, 'medium', 'todo', 120, 0),
    task('Projeto prático com Signals', programacao, angular, 3, 'medium', 'in_progress', 240, 95, 'Criar um pequeno app usando signals e computed.'),
    task('Configurar rotas com lazy loading', programacao, angular, null, 'low', 'done', 60, 50),
    task('Exercícios de JOIN', programacao, banco, 8, 'medium', 'todo', 90, 0),
    task('Modelar banco do projeto pessoal', programacao, banco, -12, 'low', 'done', 120, 110),
    task('Streams e lambdas — exercícios', certificacao, java, 15, 'medium', 'todo', 180, 0),
    task('Ler capítulo de Collections', certificacao, java, null, 'low', 'done', 90, 85),
  ];
  // Ordem sequencial por coluna.
  for (const status of ['todo', 'in_progress', 'done'] as TaskStatus[]) {
    tasks.filter((t) => t.status === status).forEach((t, i) => (t.order = i));
  }

  // Sessões das últimas 8 semanas (gerador determinístico).
  let seed = 7;
  const random = (): number => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const contents: Record<string, string[]> = {
    [portugues.id]: ['Interpretação de texto', 'Concordância', 'Questões de banca'],
    [constitucional.id]: ['Direitos fundamentais', 'Princípios', 'Leitura da CF'],
    [administrativo.id]: ['Princípios da administração', 'Atos administrativos'],
    [java.id]: ['Collections', 'Orientação a objetos', 'Exceptions'],
    [angular.id]: ['Signals', 'Componentes', 'Rotas'],
    [banco.id]: ['Modelagem', 'SQL básico'],
  };
  const projectOf = (s: Subject): Project =>
    [portugues, constitucional, administrativo].includes(s) ? concursos : s === java ? certificacao : programacao;

  const sessions: StudySession[] = [];
  for (let offset = -55; offset <= 0; offset++) {
    if (random() < 0.4) continue;
    const count = random() < 0.3 ? 2 : 1;
    for (let n = 0; n < count; n++) {
      const s = subjects[Math.floor(random() * subjects.length)];
      const start = addDays(today, offset);
      start.setHours(n === 0 ? 8 + Math.floor(random() * 3) : 19 + Math.floor(random() * 2), Math.floor(random() * 4) * 15);
      if (start.getTime() > Date.now()) continue;
      const durationSeconds = (25 + Math.floor(random() * 8) * 10) * 60;
      const options = contents[s.id];
      sessions.push({
        id: generateId(),
        createdAt: now,
        subjectId: s.id,
        projectId: projectOf(s).id,
        taskId: null,
        start: start.toISOString(),
        end: new Date(start.getTime() + durationSeconds * 1000).toISOString(),
        durationSeconds,
        content: options[Math.floor(random() * options.length)],
        notes: random() < 0.25 ? 'Revisar os pontos marcados no caderno.' : '',
        source: random() < 0.8 ? 'timer' : 'manual',
      });
    }
  }

  const event = (title: string, type: CalendarEvent['type'], offset: number, time: string | null, s: Subject | null, description = ''): CalendarEvent => ({
    id: generateId(), createdAt: now, title, type, date: day(offset), time, subjectId: s?.id ?? null, description, done: false,
  });
  const events: CalendarEvent[] = [
    event('Simulado geral', 'exam', 10, '09:00', null, 'Simulado completo no formato da banca.'),
    event('Prova de Direito Constitucional (curso)', 'exam', 18, '19:00', constitucional),
    event('Meta: concluir conteúdos de Português', 'goal', 21, null, portugues),
    event('Revisão semanal', 'planned_session', 1, '20:00', null),
    event('Sessão de Angular', 'planned_session', 3, '19:30', angular),
  ];

  return { subjects, projects, tasks, sessions, events };
}
