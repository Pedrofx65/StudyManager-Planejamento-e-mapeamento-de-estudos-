import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Priority, ProjectStatus } from '../../core/models';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { addDays, toDateString, todayString } from '../../core/utils/date.utils';
import { PRIORITY_OPTIONS, PROJECT_STATUS_OPTIONS } from '../../core/utils/labels';
import { dateRangeValidator, notBlank } from '../../core/utils/validators';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-form.html',
})
export class ProjectForm extends BaseForm implements OnInit {
  readonly id = input<string>();

  private readonly projects = inject(ProjectService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly statusOptions = PROJECT_STATUS_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly notFound = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      name: ['', [Validators.required, notBlank, Validators.maxLength(80)]],
      description: ['', Validators.maxLength(500)],
      startDate: [todayString(), Validators.required],
      dueDate: [toDateString(addDays(new Date(), 30)), Validators.required],
      status: ['not_started' as ProjectStatus, Validators.required],
      priority: ['medium' as Priority, Validators.required],
    },
    { validators: dateRangeValidator('startDate', 'dueDate') },
  );

  protected dateRangeInvalid(): boolean {
    return this.form.hasError('dateRange') && (this.form.controls.dueDate.touched || this.submitted());
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const project = this.projects.getById(id);
    if (!project) {
      this.notFound.set(true);
      return;
    }
    const { name, description, startDate, dueDate, status, priority } = project;
    this.form.setValue({ name, description, startDate, dueDate, status, priority });
  }

  protected save(): void {
    if (!this.validate()) return;
    const value = this.form.getRawValue();
    const input = { ...value, name: value.name.trim(), description: value.description.trim() };
    const id = this.id();
    if (id) {
      this.projects.update(id, input);
      this.toast.success('Projeto atualizado.');
      this.router.navigate(['/projects', id]);
    } else {
      const created = this.projects.create(input);
      this.toast.success('Projeto criado.');
      this.router.navigate(['/projects', created.id]);
    }
  }
}
