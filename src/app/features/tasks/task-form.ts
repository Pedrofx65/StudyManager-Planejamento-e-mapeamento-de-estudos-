import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Priority, Task, TaskInput, TaskStatus } from '../../core/models';
import { ProjectService } from '../../core/services/project.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../core/utils/labels';
import { notBlank } from '../../core/utils/validators';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { TaskActions } from './task-actions';

const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, PageHeader, FieldError, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.html',
})
export class TaskForm extends BaseForm implements OnInit {
  /** Id da tarefa (rota :id). */
  readonly id = input<string>();
  /** Valores iniciais vindos de query params (?project=&subject=&status=). */
  readonly project = input<string>();
  readonly subject = input<string>();
  readonly status = input<string>();

  private readonly tasks = inject(TaskService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly actions = inject(TaskActions);
  protected readonly projects = inject(ProjectService);
  protected readonly subjects = inject(SubjectService);

  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly statusOptions = TASK_STATUS_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly task = signal<Task | undefined>(undefined);
  protected readonly notFound = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, notBlank, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(1000)],
    projectId: [''],
    subjectId: [''],
    dueDate: [''],
    priority: ['medium' as Priority, Validators.required],
    status: ['todo' as TaskStatus, Validators.required],
    estimatedMinutes: [60, [Validators.required, Validators.min(0), Validators.max(100000)]],
    spentMinutes: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      const status = this.status();
      this.form.patchValue({
        projectId: this.projects.getById(this.project()) ? this.project() : '',
        subjectId: this.subjects.getById(this.subject()) ? this.subject() : '',
        status: TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : 'todo',
      });
      return;
    }
    const task = this.tasks.getById(id);
    if (!task) {
      this.notFound.set(true);
      return;
    }
    this.task.set(task);
    this.form.setValue({
      title: task.title,
      description: task.description,
      projectId: task.projectId ?? '',
      subjectId: task.subjectId ?? '',
      dueDate: task.dueDate ?? '',
      priority: task.priority,
      status: task.status,
      estimatedMinutes: task.estimatedMinutes,
      spentMinutes: task.spentMinutes,
    });
  }

  protected save(): void {
    if (!this.validate()) return;
    const v = this.form.getRawValue();
    const input: TaskInput = {
      title: v.title.trim(),
      description: v.description.trim(),
      projectId: v.projectId || null,
      subjectId: v.subjectId || null,
      dueDate: v.dueDate || null,
      priority: v.priority,
      status: v.status,
      estimatedMinutes: Math.round(Number(v.estimatedMinutes)),
      spentMinutes: Math.round(Number(v.spentMinutes)),
    };
    const id = this.id();
    if (id) {
      this.tasks.update(id, input);
      this.toast.success('Tarefa atualizada.');
    } else {
      this.tasks.create(input);
      this.toast.success('Tarefa criada.');
    }
    this.goBack();
  }

  protected async remove(): Promise<void> {
    const task = this.task();
    if (task && (await this.actions.delete(task))) this.goBack();
  }

  protected study(): void {
    const task = this.task();
    if (task) this.actions.study(task);
  }

  /** Volta para o projeto de origem, se houver, ou para a lista de tarefas. */
  protected goBack(): void {
    const project = this.project();
    if (project && this.projects.getById(project)) {
      this.router.navigate(['/projects', project]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }
}
