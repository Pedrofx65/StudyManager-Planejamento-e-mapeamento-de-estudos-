import { Injectable, computed, inject } from '@angular/core';
import { CalendarItem, DateString } from '../models';
import { daysUntil, formatDuration, toDateString } from '../utils/date.utils';
import { CALENDAR_KIND_META } from '../utils/labels';
import { CalendarEventService } from './calendar-event.service';
import { ProjectService } from './project.service';
import { SessionService } from './session.service';
import { SubjectService } from './subject.service';
import { TaskService } from './task.service';

/**
 * Agrega tudo o que aparece no calendário: prazos de tarefas e projetos,
 * eventos (provas, metas, sessões planejadas) e sessões realizadas.
 */
@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly tasks = inject(TaskService);
  private readonly projects = inject(ProjectService);
  private readonly events = inject(CalendarEventService);
  private readonly sessions = inject(SessionService);
  private readonly subjects = inject(SubjectService);

  readonly items = computed<CalendarItem[]>(() => {
    const items: CalendarItem[] = [];
    const subjectColor = (id: string | null): string | null => this.subjects.getById(id)?.color ?? null;

    for (const task of this.tasks.items()) {
      if (!task.dueDate) continue;
      const done = task.status === 'done';
      items.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        date: task.dueDate,
        time: null,
        color: subjectColor(task.subjectId),
        done,
        overdue: !done && daysUntil(task.dueDate) < 0,
        link: ['/tasks', task.id, 'edit'],
        eventId: null,
      });
    }

    for (const project of this.projects.items()) {
      const done = project.status === 'completed';
      items.push({
        id: `project-${project.id}`,
        kind: 'project',
        title: `Prazo: ${project.name}`,
        date: project.dueDate,
        time: null,
        color: null,
        done,
        overdue: !done && daysUntil(project.dueDate) < 0,
        link: ['/projects', project.id],
        eventId: null,
      });
    }

    for (const event of this.events.items()) {
      items.push({
        id: `event-${event.id}`,
        kind: event.type,
        title: event.title,
        date: event.date,
        time: event.time,
        color: subjectColor(event.subjectId),
        done: event.done,
        overdue: !event.done && event.type !== 'planned_session' && daysUntil(event.date) < 0,
        link: null,
        eventId: event.id,
      });
    }

    // Sessões realizadas: um item por dia com o total estudado.
    const perDay = new Map<DateString, number>();
    for (const s of this.sessions.items()) {
      const day = toDateString(new Date(s.start));
      perDay.set(day, (perDay.get(day) ?? 0) + s.durationSeconds);
    }
    for (const [day, seconds] of perDay) {
      items.push({
        id: `session-${day}`,
        kind: 'session',
        title: `Estudou ${formatDuration(seconds)}`,
        date: day,
        time: null,
        color: CALENDAR_KIND_META.session.color,
        done: false,
        overdue: false,
        link: null,
        eventId: null,
      });
    }

    return items.sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')));
  });

  /** Itens indexados por dia. */
  readonly byDay = computed(() => {
    const map = new Map<DateString, CalendarItem[]>();
    for (const item of this.items()) {
      const list = map.get(item.date);
      if (list) list.push(item);
      else map.set(item.date, [item]);
    }
    return map;
  });

  /** Pendências com data (exclui sessões realizadas). */
  readonly openDeadlines = computed(() => this.items().filter((i) => i.kind !== 'session' && !i.done));
}
