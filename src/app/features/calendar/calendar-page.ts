import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CalendarEventInput, CalendarEventType, CalendarItem, CalendarItemKind, DateString } from '../../core/models';
import { CalendarEventService } from '../../core/services/calendar-event.service';
import { CalendarService } from '../../core/services/calendar.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { SettingsService } from '../../core/services/settings.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { addDays, daysUntil, parseDate, startOfWeek, toDateString, todayString } from '../../core/utils/date.utils';
import { CALENDAR_KIND_META } from '../../core/utils/labels';
import { notBlank } from '../../core/utils/validators';
import { EmptyState } from '../../shared/components/empty-state';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';
import { RelativeDayPipe } from '../../shared/pipes/relative-day.pipe';

interface CalendarDay {
  date: DateString;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
  hasOverdue: boolean;
  hasUpcoming: boolean;
}

const KIND_ORDER: CalendarItemKind[] = ['task', 'project', 'exam', 'goal', 'planned_session', 'session'];
const EVENT_TYPES: CalendarEventType[] = ['exam', 'goal', 'planned_session'];
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

@Component({
  selector: 'app-calendar-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PageHeader, EmptyState, FieldError, RelativeDayPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage extends BaseForm {
  private readonly calendar = inject(CalendarService);
  private readonly events = inject(CalendarEventService);
  private readonly tasks = inject(TaskService);
  private readonly settings = inject(SettingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly subjects = inject(SubjectService);

  protected readonly kinds = KIND_ORDER;
  protected readonly eventTypes = EVENT_TYPES;
  protected readonly meta = CALENDAR_KIND_META;
  protected readonly weekdays = WEEKDAYS;

  protected readonly month = signal(this.firstOfMonth(new Date()));
  protected readonly selectedDate = signal<DateString>(todayString());
  protected readonly hiddenKinds = signal<ReadonlySet<CalendarItemKind>>(new Set());

  /** Formulário de evento: null = fechado, '' = novo, id = edição. */
  protected readonly editingEventId = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, notBlank, Validators.maxLength(100)]],
    type: ['exam' as CalendarEventType, Validators.required],
    date: [todayString(), Validators.required],
    time: [''],
    subjectId: [''],
    description: ['', Validators.maxLength(500)],
  });

  private readonly upcomingDays = computed(() => this.settings.settings().upcomingDays);

  private isVisible(item: CalendarItem): boolean {
    return !this.hiddenKinds().has(item.kind);
  }

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const month = this.month();
    const byDay = this.calendar.byDay();
    const today = todayString();
    const upcoming = this.upcomingDays();
    const start = startOfWeek(month);
    const weeks: CalendarDay[][] = [];
    let cursor = start;

    for (let w = 0; w < 6; w++) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = toDateString(cursor);
        const items = (byDay.get(date) ?? []).filter((i) => this.isVisible(i));
        week.push({
          date,
          day: cursor.getDate(),
          inMonth: cursor.getMonth() === month.getMonth(),
          isToday: date === today,
          items,
          hasOverdue: items.some((i) => i.overdue),
          hasUpcoming: items.some((i) => !i.done && i.kind !== 'session' && daysUntil(date) >= 0 && daysUntil(date) <= upcoming),
        });
        cursor = addDays(cursor, 1);
      }
      // Remove a última semana se ela estiver toda no mês seguinte.
      if (w > 3 && !week.some((d) => d.inMonth)) break;
      weeks.push(week);
    }
    return weeks;
  });

  protected readonly selectedItems = computed(() =>
    (this.calendar.byDay().get(this.selectedDate()) ?? []).filter((i) => this.isVisible(i)),
  );

  protected readonly overdue = computed(() =>
    this.calendar.openDeadlines().filter((i) => i.overdue && this.isVisible(i)).slice(0, 8),
  );

  protected readonly upcoming = computed(() => {
    const days = this.upcomingDays();
    return this.calendar
      .openDeadlines()
      .filter((i) => {
        const diff = daysUntil(i.date);
        return diff >= 0 && diff <= days && this.isVisible(i);
      })
      .slice(0, 8);
  });

  // --- Navegação ---------------------------------------------------------------

  protected prevMonth(): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  protected goToday(): void {
    this.month.set(this.firstOfMonth(new Date()));
    this.selectDay(todayString());
  }

  protected selectDay(date: DateString): void {
    this.selectedDate.set(date);
    const d = parseDate(date);
    if (d.getMonth() !== this.month().getMonth() || d.getFullYear() !== this.month().getFullYear()) {
      this.month.set(this.firstOfMonth(d));
    }
    if (this.editingEventId() === '') this.form.controls.date.setValue(date);
  }

  protected toggleKind(kind: CalendarItemKind): void {
    const next = new Set(this.hiddenKinds());
    if (next.has(kind)) next.delete(kind);
    else next.add(kind);
    this.hiddenKinds.set(next);
  }

  // --- Itens -----------------------------------------------------------------

  protected openItem(item: CalendarItem): void {
    if (item.eventId) {
      this.editEvent(item.eventId);
    } else if (item.kind === 'session') {
      this.router.navigate(['/history']);
    } else if (item.link) {
      this.router.navigate(item.link);
    }
  }

  protected canToggle(item: CalendarItem): boolean {
    return item.kind === 'task' || !!item.eventId;
  }

  protected toggleDone(item: CalendarItem): void {
    if (item.eventId) {
      this.events.toggleDone(item.eventId);
    } else if (item.kind === 'task') {
      const taskId = item.id.replace(/^task-/, '');
      const task = this.tasks.getById(taskId);
      if (task) this.tasks.setStatus(task.id, task.status === 'done' ? 'todo' : 'done');
    }
  }

  // --- Eventos ---------------------------------------------------------------

  protected newEvent(): void {
    this.editingEventId.set('');
    this.submitted.set(false);
    this.form.reset({ title: '', type: 'exam', date: this.selectedDate(), time: '', subjectId: '', description: '' });
  }

  protected editEvent(id: string): void {
    const event = this.events.getById(id);
    if (!event) return;
    this.editingEventId.set(id);
    this.submitted.set(false);
    this.form.reset({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time ?? '',
      subjectId: event.subjectId ?? '',
      description: event.description,
    });
  }

  protected cancelEvent(): void {
    this.editingEventId.set(null);
  }

  protected saveEvent(): void {
    if (!this.validate()) return;
    const v = this.form.getRawValue();
    const id = this.editingEventId();
    const input: CalendarEventInput = {
      title: v.title.trim(),
      type: v.type,
      date: v.date,
      time: v.time || null,
      subjectId: v.subjectId || null,
      description: v.description.trim(),
      done: id ? (this.events.getById(id)?.done ?? false) : false,
    };
    if (id) {
      this.events.update(id, input);
      this.toast.success('Evento atualizado.');
    } else {
      this.events.create(input);
      this.toast.success('Evento adicionado ao calendário.');
    }
    this.selectDay(v.date);
    this.editingEventId.set(null);
  }

  protected async deleteEvent(): Promise<void> {
    const id = this.editingEventId();
    const event = id ? this.events.getById(id) : undefined;
    if (!event) return;
    if (!(await this.confirm.confirmDelete(event.title))) return;
    this.events.delete(event.id);
    this.editingEventId.set(null);
    this.toast.success('Evento excluído.');
  }

  private firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
}
