import { Injectable, computed } from '@angular/core';
import { CalendarEvent, CalendarEventInput } from '../models';
import { generateId } from '../utils/id.utils';
import { EntityStore } from './entity-store';
import { STORAGE_KEYS } from './storage.service';

/** Eventos do calendário: provas, metas e sessões planejadas. */
@Injectable({ providedIn: 'root' })
export class CalendarEventService extends EntityStore<CalendarEvent> {
  constructor() {
    super(STORAGE_KEYS.events);
  }

  readonly sorted = computed(() =>
    [...this.items()].sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? ''))),
  );

  create(input: CalendarEventInput): CalendarEvent {
    return this.insert({ ...input, id: generateId(), createdAt: new Date().toISOString() });
  }

  update(id: string, input: Partial<CalendarEventInput>): CalendarEvent | undefined {
    return this.patch(id, input);
  }

  toggleDone(id: string): void {
    const event = this.getById(id);
    if (event) this.patch(id, { done: !event.done });
  }

  delete(id: string): void {
    this.removeById(id);
  }

  unlinkSubject(subjectId: string): void {
    this.mapAll((e) => (e.subjectId === subjectId ? { ...e, subjectId: null } : e));
  }
}
