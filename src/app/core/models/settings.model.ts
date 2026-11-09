export type ThemeMode = 'dark' | 'light';

export interface AppSettings {
  userName: string;
  theme: ThemeMode;
  /** Meta semanal de estudo em horas. */
  weeklyGoalHours: number;
  /** Quantos dias à frente um prazo é considerado "próximo". */
  upcomingDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  theme: 'dark',
  weeklyGoalHours: 10,
  upcomingDays: 7,
};
