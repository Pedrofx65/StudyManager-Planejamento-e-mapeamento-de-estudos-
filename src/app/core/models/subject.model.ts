import { Entity } from './common.model';

/** Conteúdo (tópico) de uma matéria. */
export interface SubjectTopic {
  id: string;
  title: string;
  done: boolean;
}

export interface Subject extends Entity {
  name: string;
  description: string;
  category: string;
  /** Cor de identificação em hexadecimal (#rrggbb). */
  color: string;
  plannedHours: number;
  topics: SubjectTopic[];
}

export type SubjectInput = Omit<Subject, 'id' | 'createdAt' | 'topics'>;

/** Matéria com os indicadores calculados a partir das sessões e tópicos. */
export interface SubjectStats {
  subject: Subject;
  studiedSeconds: number;
  /** Percentual de conclusão (0–100). */
  progress: number;
  topicsDone: number;
}
