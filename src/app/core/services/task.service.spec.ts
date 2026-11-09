import { TestBed } from '@angular/core/testing';
import { TaskInput } from '../models';
import { TaskService } from './task.service';

const input = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  title: 'Tarefa',
  description: '',
  projectId: null,
  subjectId: null,
  dueDate: null,
  priority: 'medium',
  status: 'todo',
  estimatedMinutes: 60,
  spentMinutes: 0,
  ...overrides,
});

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  it('cria tarefas com ordem sequencial por coluna e persiste no LocalStorage', () => {
    const a = service.create(input({ title: 'A' }));
    const b = service.create(input({ title: 'B' }));
    expect([a.order, b.order]).toEqual([0, 1]);
    expect(JSON.parse(localStorage.getItem('sm.tasks')!)).toHaveLength(2);
  });

  it('registra a data de conclusão ao mudar o status para concluída', () => {
    const task = service.create(input());
    service.setStatus(task.id, 'done');
    expect(service.getById(task.id)?.completedAt).toBeTruthy();
    service.setStatus(task.id, 'todo');
    expect(service.getById(task.id)?.completedAt).toBeNull();
  });

  it('move tarefas entre colunas do Kanban na posição indicada', () => {
    const a = service.create(input({ title: 'A', status: 'in_progress' }));
    const b = service.create(input({ title: 'B', status: 'in_progress' }));
    const c = service.create(input({ title: 'C' }));

    service.move(c.id, 'in_progress', 1);

    expect(service.board().in_progress.map((t) => t.title)).toEqual(['A', 'C', 'B']);
    expect(service.board().todo).toHaveLength(0);
    expect(service.getById(c.id)?.status).toBe('in_progress');
    expect(service.getById(a.id)?.order).toBe(0);
    expect(service.getById(b.id)?.order).toBe(2);
  });

  it('nunca deixa o tempo utilizado negativo', () => {
    const task = service.create(input({ spentMinutes: 10 }));
    service.addSpentMinutes(task.id, -30);
    expect(service.getById(task.id)?.spentMinutes).toBe(0);
  });

  it('ordena pendentes por prioridade e prazo', () => {
    service.create(input({ title: 'baixa', priority: 'low', dueDate: '2030-01-01' }));
    service.create(input({ title: 'alta-tarde', priority: 'high', dueDate: '2030-02-01' }));
    service.create(input({ title: 'alta-cedo', priority: 'high', dueDate: '2030-01-01' }));
    service.create(input({ title: 'feita', priority: 'high', status: 'done' }));
    expect(service.prioritized().map((t) => t.title)).toEqual(['alta-cedo', 'alta-tarde', 'baixa']);
  });
});
