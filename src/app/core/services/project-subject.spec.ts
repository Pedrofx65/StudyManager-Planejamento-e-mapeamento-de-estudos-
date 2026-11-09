import { TestBed } from '@angular/core/testing';
import { ProjectService } from './project.service';
import { SessionService } from './session.service';
import { SubjectService } from './subject.service';
import { TaskService } from './task.service';

describe('Progresso de projetos e matérias', () => {
  let projects: ProjectService;
  let tasks: TaskService;
  let subjects: SubjectService;
  let sessions: SessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    projects = TestBed.inject(ProjectService);
    tasks = TestBed.inject(TaskService);
    subjects = TestBed.inject(SubjectService);
    sessions = TestBed.inject(SessionService);
  });

  const newTask = (projectId: string, done: boolean) =>
    tasks.create({
      title: 't', description: '', projectId, subjectId: null, dueDate: null, priority: 'low',
      status: done ? 'done' : 'todo', estimatedMinutes: 0, spentMinutes: 0,
    });

  it('calcula o progresso do projeto pelas tarefas concluídas', () => {
    const p = projects.create({
      name: 'Concurso', description: '', startDate: '2026-01-01', dueDate: '2026-12-31', status: 'in_progress', priority: 'high',
    });
    newTask(p.id, true);
    newTask(p.id, false);
    newTask(p.id, false);
    newTask(p.id, true);
    expect(projects.progressOf(p.id)).toEqual({ total: 4, done: 2, progress: 50 });
  });

  it('ao excluir um projeto mantém as tarefas, apenas desvinculando', () => {
    const p = projects.create({
      name: 'X', description: '', startDate: '2026-01-01', dueDate: '2026-02-01', status: 'not_started', priority: 'low',
    });
    const t = newTask(p.id, false);
    projects.delete(p.id);
    expect(projects.items()).toHaveLength(0);
    expect(tasks.getById(t.id)?.projectId).toBeNull();
  });

  it('usa conteúdos concluídos como progresso da matéria quando existem', () => {
    const s = subjects.create(
      { name: 'Java', description: '', category: 'Programação', color: '#3987e5', plannedHours: 10 },
      ['OO', 'Collections', 'Streams', 'JDBC'],
    );
    subjects.toggleTopic(s.id, s.topics[0].id);
    expect(subjects.statsOf(s.id)?.progress).toBe(25);
  });

  it('usa horas estudadas / planejadas quando não há conteúdos e soma o tempo na tarefa', () => {
    const s = subjects.create({ name: 'SQL', description: '', category: '', color: '#3987e5', plannedHours: 4 });
    const t = tasks.create({
      title: 'Exercícios', description: '', projectId: null, subjectId: s.id, dueDate: null, priority: 'low',
      status: 'todo', estimatedMinutes: 120, spentMinutes: 0,
    });
    sessions.add({
      subjectId: s.id, projectId: null, taskId: t.id, start: '2026-01-01T10:00:00.000Z', end: '2026-01-01T11:00:00.000Z',
      durationSeconds: 3600, content: '', notes: '', source: 'manual',
    });
    expect(subjects.statsOf(s.id)?.progress).toBe(25);
    expect(tasks.getById(t.id)?.spentMinutes).toBe(60);
  });
});
