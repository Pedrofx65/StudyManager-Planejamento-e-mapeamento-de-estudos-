import { DateString, Entity } from './common.model';

/** Eventos criados manualmente no calendário. */
export type CalendarEventType = 'exam' | 'goal' | 'planned_session';

export interface CalendarEvent extends Entity {
  title: string;
  type: CalendarEventType;
  date: DateString;
  /** Horário opcional (HH:mm). */
  time: string | null;
  subjectId: string | null;
  description: string;
  done: boolean;
}

export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt'>;

/** Item exibido no calendário (eventos, prazos de tarefas e sessões realizadas). */
export type CalendarItemKind = CalendarEventType | 'task' | 'session' | 'project';

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  date: DateString;
  time: string | null;
  color: string | null;
  done: boolean;
  overdue: boolean;
  /** Rota para abrir o item de origem, quando houver. */
  link: string[] | null;
  /** Id do evento quando o item for um CalendarEvent editável. */
  eventId: string | null;
}
