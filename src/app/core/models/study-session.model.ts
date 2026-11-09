import { Entity } from './common.model';

export type SessionSource = 'timer' | 'manual';

/** Uma sessão de estudo registrada pelo cronômetro ou manualmente. */
export interface StudySession extends Entity {
  subjectId: string | null;
  projectId: string | null;
  taskId: string | null;
  /** Início em ISO 8601. */
  start: string;
  /** Término em ISO 8601. */
  end: string;
  durationSeconds: number;
  /** Conteúdo estudado. */
  content: string;
  /** Observações pessoais. */
  notes: string;
  source: SessionSource;
}

export type StudySessionInput = Omit<StudySession, 'id' | 'createdAt'>;
