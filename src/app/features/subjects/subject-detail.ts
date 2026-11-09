import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SubjectTopic } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { SessionService } from '../../core/services/session.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { TimerService } from '../../core/services/timer.service';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadge } from '../../shared/components/badges';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressBar } from '../../shared/components/progress-bar';
import { Autofocus } from '../../shared/directives/autofocus';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-subject-detail',
  imports: [RouterLink, DatePipe, ProgressBar, EmptyState, StatusBadge, DurationPipe, Autofocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subject-detail.html',
  styleUrl: './subjects.scss',
})
export class SubjectDetail {
  readonly id = input.required<string>();

  private readonly subjects = inject(SubjectService);
  private readonly sessions = inject(SessionService);
  private readonly tasks = inject(TaskService);
  private readonly timer = inject(TimerService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly stats = computed(() => this.subjects.statsOf(this.id()));
  protected readonly subject = computed(() => this.stats()?.subject);

  protected readonly recentSessions = computed(() =>
    this.sessions.sorted().filter((s) => s.subjectId === this.id()).slice(0, 6),
  );
  protected readonly relatedTasks = computed(() =>
    this.tasks.items().filter((t) => t.subjectId === this.id()).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done')),
  );

  protected readonly newTopic = signal('');
  protected readonly editingTopicId = signal<string | null>(null);

  protected addTopic(): void {
    const title = this.newTopic().trim();
    if (!title) return;
    this.subjects.addTopic(this.id(), title);
    this.newTopic.set('');
  }

  protected toggleTopic(topic: SubjectTopic): void {
    this.subjects.toggleTopic(this.id(), topic.id);
  }

  protected startEdit(topic: SubjectTopic): void {
    this.editingTopicId.set(topic.id);
  }

  protected saveTopic(topic: SubjectTopic, title: string): void {
    if (this.editingTopicId() !== topic.id) return;
    if (title.trim()) this.subjects.renameTopic(this.id(), topic.id, title);
    this.editingTopicId.set(null);
  }

  protected async removeTopic(topic: SubjectTopic): Promise<void> {
    const ok = await this.confirm.confirmDelete(topic.title);
    if (ok) this.subjects.removeTopic(this.id(), topic.id);
  }

  /** Seleciona a matéria no cronômetro e abre a página do cronômetro. */
  protected studyNow(): void {
    if (this.timer.isActive()) {
      this.toast.info('Já existe uma sessão em andamento.');
    } else {
      this.timer.setSelection({ subjectId: this.id(), taskId: null });
    }
    this.router.navigate(['/timer']);
  }

  protected async remove(): Promise<void> {
    const subject = this.subject();
    if (!subject) return;
    const ok = await this.confirm.confirmDelete(
      subject.name,
      'Tarefas, sessões e eventos vinculados serão mantidos, mas ficarão sem matéria.',
    );
    if (!ok) return;
    this.subjects.delete(subject.id);
    this.toast.success('Matéria excluída.');
    this.router.navigate(['/subjects']);
  }
}
