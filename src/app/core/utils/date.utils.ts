import { DateString } from '../models';

const MS_PER_DAY = 86_400_000;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Converte um Date para YYYY-MM-DD usando o fuso local. */
export function toDateString(date: Date): DateString {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte YYYY-MM-DD em Date local (00:00). */
export function parseDate(value: DateString): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayString(): DateString {
  return toDateString(new Date());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const diff = (day.getDay() + 6) % 7;
  return addDays(day, -diff);
}

/** Dias inteiros entre hoje e a data (negativo = atrasado). */
export function daysUntil(value: DateString, today: Date = new Date()): number {
  return Math.round((parseDate(value).getTime() - startOfDay(today).getTime()) / MS_PER_DAY);
}

export function isOverdue(value: DateString | null, today: Date = new Date()): boolean {
  return !!value && daysUntil(value, today) < 0;
}

export function isUpcoming(value: DateString | null, days: number, today: Date = new Date()): boolean {
  if (!value) return false;
  const diff = daysUntil(value, today);
  return diff >= 0 && diff <= days;
}

/** Texto amigável para o prazo: "Hoje", "Amanhã", "em 3 dias", "2 dias atrasado". */
export function relativeDayLabel(value: DateString, today: Date = new Date()): string {
  const diff = daysUntil(value, today);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff > 1) return `em ${diff} dias`;
  return `${Math.abs(diff)} dias atrás`;
}

/** Combina data (YYYY-MM-DD) e hora (HH:mm) em ISO 8601. */
export function combineDateTime(date: DateString, time: string): string {
  const [h, min] = time.split(':').map(Number);
  const d = parseDate(date);
  d.setHours(h ?? 0, min ?? 0, 0, 0);
  return d.toISOString();
}

/** Extrai HH:mm local de uma data ISO. */
export function toTimeString(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formata segundos como HH:MM:SS (cronômetro). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** Formata segundos como "2h 15min" / "45min" / "30s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  if (m > 0) return `${m}min`;
  return s > 0 ? `${s}s` : '0min';
}
