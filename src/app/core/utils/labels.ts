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
  task: { label: 'Prazo de tarefa', icon: 'bi-check2-square', color: '#3987e5' },
  project: { label: 'Prazo de projeto', icon: 'bi-folder2', color: '#9085e9' },
  exam: { label: 'Prova', icon: 'bi-mortarboard', color: '#d55181' },
  goal: { label: 'Meta de estudo', icon: 'bi-flag', color: '#c98500' },
  planned_session: { label: 'Sessão planejada', icon: 'bi-calendar-plus', color: '#199e70' },
  session: { label: 'Sessão realizada', icon: 'bi-stopwatch', color: '#d95926' },
};

export const PRIORITY_WEIGHT: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export function optionMeta<T extends string>(options: OptionMeta<T>[], value: T): OptionMeta<T> {
  return options.find((o) => o.value === value) ?? options[0];
}

/**
 * Paleta categórica sugerida para as matérias, em ordem fixa.
 * Validada (contraste, separação para daltonismo e visão normal)
 * nos fundos claro (#ffffff) e escuro (#15171c).
 */
export const SUBJECT_COLORS = [
  '#3987e5', '#d95926', '#199e70', '#c98500',
  '#d55181', '#008300', '#9085e9', '#e66767',
];

/** Próxima cor da paleta ainda não usada (ou a primeira, se todas estiverem em uso). */
export function nextSubjectColor(used: string[]): string {
  const taken = new Set(used.map((c) => c.toLowerCase()));
  return SUBJECT_COLORS.find((c) => !taken.has(c)) ?? SUBJECT_COLORS[used.length % SUBJECT_COLORS.length];
}
