/** Campos comuns a todas as entidades persistidas. */
export interface Entity {
  id: string;
  /** Data/hora de criação em ISO 8601. */
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high';

/** Data no formato YYYY-MM-DD (sem fuso horário). */
export type DateString = string;
