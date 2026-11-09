import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { SessionSource, StudySessionInput } from '../../core/models';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { combineDateTime, toDateString, toTimeString, todayString } from '../../core/utils/date.utils';
import { timeRangeValidator } from '../../core/utils/validators';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

/** Registro manual ou edição de uma sessão de estudo. */
@Component({
  selector: 'app-session-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FieldError, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-form.html',
})
export class SessionForm extends BaseForm implements OnInit {
  readonly id = input<string>();

  private readonly sessions = inject(SessionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly subjects = inject(SubjectService);
  protected readonly projects = inject(ProjectService);
  protected readonly tasks = inject(TaskService);

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly notFound = signal(false);
  private source: SessionSource = 'manual';

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      date: [todayString(), Validators.required],
      startTime: ['08:00', Validators.required],
      endTime: ['09:00', Validators.required],
      subjectId: [''],
      projectId: [''],
      taskId: [''],
      content: ['', Validators.maxLength(200)],
      notes: ['', Validators.maxLength(1000)],
    },
    { validators: timeRangeValidator('startTime', 'endTime') },
  );

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** Duração calculada a partir dos horários informados. */
  protected readonly durationSeconds = computed(() => {
    const { date, startTime, endTime } = this.formValue();
    if (!date || !startTime || !endTime) return 0;
    const diff = new Date(combineDateTime(date, endTime)).getTime() - new Date(combineDateTime(date, startTime)).getTime();
    return Math.max(0, Math.round(diff / 1000));
  });

  protected readonly availableTasks = computed(() => {
    const { projectId, subjectId, taskId } = this.formValue();
    return this.tasks
      .items()
      .filter((t) => t.id === taskId || ((!projectId || t.projectId === projectId) && (!subjectId || t.subjectId === subjectId)));
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    const session = this.sessions.getById(id);
    if (!session) {
      this.notFound.set(true);
      return;
    }
    this.source = session.source;
    this.form.setValue({
      date: toDateString(new Date(session.start)),
      startTime: toTimeString(session.start),
      endTime: toTimeString(session.end),
      subjectId: session.subjectId ?? '',
      projectId: session.projectId ?? '',
      taskId: session.taskId ?? '',
      content: session.content,
      notes: session.notes,
    });
  }

  protected timeRangeInvalid(): boolean {
    return this.form.hasError('timeRange') && (this.form.controls.endTime.touched || this.submitted());
  }

  protected save(): void {
    if (!this.validate()) return;
    const v = this.form.getRawValue();
    const start = combineDateTime(v.date, v.startTime);
    const end = combineDateTime(v.date, v.endTime);
    const id = this.id();
    // Ao editar uma sessão do cronômetro, mantém os segundos se os horários não mudaram.
    const original = id ? this.sessions.getById(id) : undefined;
    const sameTimes =
      original && toTimeString(original.start) === v.startTime && toTimeString(original.end) === v.endTime &&
      toDateString(new Date(original.start)) === v.date;

    const input: StudySessionInput = {
      start: sameTimes ? original.start : start,
      end: sameTimes ? original.end : end,
      durationSeconds: sameTimes ? original.durationSeconds : this.durationSeconds(),
      subjectId: v.subjectId || null,
      projectId: v.projectId || null,
      taskId: v.taskId || null,
      content: v.content.trim(),
      notes: v.notes.trim(),
      source: this.source,
    };

    if (id) {
      this.sessions.update(id, input);
      this.toast.success('Sessão atualizada.');
    } else {
      this.sessions.add(input);
      this.toast.success('Estudo registrado.');
    }
    this.router.navigate(['/history']);
  }
}
