import { CalendarItemKind, Priority, ProjectStatus, TaskStatus } from '../models';

export interface OptionMeta<T extends string> {
  value: T;
  label: string;
  /** Variante visual usada nos chips (primary, success, warning, danger ou vazio). */
  tone: '' | 'primary' | 'success' | 'warning' | 'danger';
  icon: string;
}

export const PRIORITY_OPTIONS: OptionMeta<Priority>[] = [
  { value: 'low', label: 'Baixa', tone: '', icon: 'bi-arrow-down' },
  { value: 'medium', label: 'Média', tone: 'warning', icon: 'bi-dash' },
  { value: 'high', label: 'Alta', tone: 'danger', icon: 'bi-arrow-up' },
];

export const PROJECT_STATUS_OPTIONS: OptionMeta<ProjectStatus>[] = [
  { value: 'not_started', label: 'Não iniciado', tone: '', icon: 'bi-circle' },
  { value: 'in_progress', label: 'Em andamento', tone: 'primary', icon: 'bi-circle-half' },
  { value: 'completed', label: 'Concluído', tone: 'success', icon: 'bi-check-circle-fill' },
];

export const TASK_STATUS_OPTIONS: OptionMeta<TaskStatus>[] = [
  { value: 'todo', label: 'A fazer', tone: '', icon: 'bi-circle' },
  { value: 'in_progress', label: 'Em andamento', tone: 'primary', icon: 'bi-circle-half' },
  { value: 'done', label: 'Concluída', tone: 'success', icon: 'bi-check-circle-fill' },
];

export const CALENDAR_KIND_META: Record<CalendarItemKind, { label: string; icon: string; color: string }> = {
  task: { label: 'Prazo de tarefa', icon: 'bi-check2-square', color: '#3b82f6' },
  project: { label: 'Prazo de projeto', icon: 'bi-folder2', color: '#8b5cf6' },
  exam: { label: 'Prova', icon: 'bi-mortarboard', color: '#ef4444' },
  goal: { label: 'Meta de estudo', icon: 'bi-flag', color: '#f59e0b' },
  planned_session: { label: 'Sessão planejada', icon: 'bi-calendar-plus', color: '#06b6d4' },
  session: { label: 'Sessão realizada', icon: 'bi-stopwatch', color: '#22c55e' },
};

export const PRIORITY_WEIGHT: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function optionMeta<T extends string>(options: OptionMeta<T>[], value: T): OptionMeta<T> {
  return options.find((o) => o.value === value) ?? options[0];
}

/** Paleta sugerida para as cores das matérias. */
export const SUBJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#22c55e', '#14b8a6', '#06b6d4', '#64748b',
];
