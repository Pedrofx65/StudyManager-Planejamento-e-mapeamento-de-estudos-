import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SubjectService } from '../../core/services/subject.service';
import { ToastService } from '../../core/services/toast.service';
import { SUBJECT_COLORS, nextSubjectColor } from '../../core/utils/labels';
import { notBlank } from '../../core/utils/validators';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';

@Component({
  selector: 'app-subject-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subject-form.html',
  styleUrl: './subjects.scss',
})
export class SubjectForm extends BaseForm implements OnInit {
  /** Id da rota (ausente ao criar). */
  readonly id = input<string>();

  private readonly subjects = inject(SubjectService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly colors = SUBJECT_COLORS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly notFound = signal(false);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, notBlank, Validators.maxLength(60)]],
    description: ['', Validators.maxLength(300)],
    category: ['', Validators.maxLength(40)],
    color: [SUBJECT_COLORS[0], Validators.required],
    plannedHours: [20, [Validators.required, Validators.min(0), Validators.max(10000)]],
    topics: [''],
  });

  /** Sugestões de categoria a partir das matérias existentes. */
  protected readonly categorySuggestions = computed(() => [
    ...new Set(['Concursos', 'Programação', 'Idiomas', 'Faculdade', 'Certificações', ...this.subjects.items().map((s) => s.category)].filter(Boolean)),
  ]);

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.form.controls.color.setValue(nextSubjectColor(this.subjects.items().map((s) => s.color)));
      return;
    }
    const subject = this.subjects.getById(id);
    if (!subject) {
      this.notFound.set(true);
      return;
    }
    const { name, description, category, color, plannedHours } = subject;
    this.form.patchValue({ name, description, category, color, plannedHours });
  }

  protected selectColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  protected save(): void {
    if (!this.validate()) return;
    const { topics, ...value } = this.form.getRawValue();
    const input = {
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      category: value.category.trim(),
      plannedHours: Number(value.plannedHours),
    };

    const id = this.id();
    if (id) {
      this.subjects.update(id, input);
      this.toast.success('Matéria atualizada.');
      this.router.navigate(['/subjects', id]);
    } else {
      const topicList = topics.split('\n').map((t) => t.trim()).filter(Boolean);
      const created = this.subjects.create(input, topicList);
      this.toast.success('Matéria criada.');
      this.router.navigate(['/subjects', created.id]);
    }
  }
}
