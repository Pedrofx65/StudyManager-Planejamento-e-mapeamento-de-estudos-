import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { SubjectService } from '../../core/services/subject.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyState } from '../../shared/components/empty-state';
import { PageHeader } from '../../shared/components/page-header';
import { ProgressBar } from '../../shared/components/progress-bar';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-subject-list',
  imports: [RouterLink, PageHeader, EmptyState, ProgressBar, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subject-list.html',
  styleUrl: './subjects.scss',
})
export class SubjectList {
  private readonly subjectService = inject(SubjectService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly category = signal('');

  protected readonly categories = computed(() =>
    [...new Set(this.subjectService.items().map((s) => s.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    ),
  );

  protected readonly hasSubjects = computed(() => this.subjectService.items().length > 0);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const category = this.category();
    return this.subjectService.stats().filter(
      ({ subject }) =>
        (!category || subject.category === category) &&
        (!term || subject.name.toLowerCase().includes(term) || subject.description.toLowerCase().includes(term)),
    );
  });

  protected open(subject: Subject): void {
    this.router.navigate(['/subjects', subject.id]);
  }

  protected async remove(subject: Subject, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.confirmDelete(
      subject.name,
      'Tarefas, sessões e eventos vinculados serão mantidos, mas ficarão sem matéria.',
    );
    if (!ok) return;
    this.subjectService.delete(subject.id);
    this.toast.success('Matéria excluída.');
  }

  protected clearFilters(): void {
    this.search.set('');
    this.category.set('');
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}
