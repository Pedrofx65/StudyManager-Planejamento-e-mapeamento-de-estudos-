import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Project, Subject, Task } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { TimerService } from '../../core/services/timer.service';
import { ToastService } from '../../core/services/toast.service';

/** Ações e consultas compartilhadas entre a lista e o Kanban de tarefas. */
@Injectable({ providedIn: 'root' })
export class TaskActions {
  private readonly tasks = inject(TaskService);
  private readonly sessions = inject(SessionService);
  private readonly projects = inject(ProjectService);
  private readonly subjects = inject(SubjectService);
  private readonly timer = inject(TimerService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly projectMap = computed(() => new Map(this.projects.items().map((p) => [p.id, p])));
  private readonly subjectMap = computed(() => new Map(this.subjects.items().map((s) => [s.id, s])));

  projectOf(task: Task): Project | undefined {
    return task.projectId ? this.projectMap().get(task.projectId) : undefined;
  }

  subjectOf(task: Task): Subject | undefined {
    return task.subjectId ? this.subjectMap().get(task.subjectId) : undefined;
  }

  toggleDone(task: Task): void {
    this.tasks.setStatus(task.id, task.status === 'done' ? 'todo' : 'done');
  }

  async delete(task: Task): Promise<boolean> {
    const ok = await this.confirm.confirmDelete(task.title, 'As sessões de estudo registradas serão mantidas.');
    if (!ok) return false;
    this.sessions.unlinkTask(task.id);
    this.tasks.delete(task.id);
    this.toast.success('Tarefa excluída.');
    return true;
  }

  /** Inicia o cronômetro já vinculado à tarefa. */
  study(task: Task): void {
    if (this.timer.isActive()) {
      this.toast.info('Já existe uma sessão em andamento. Finalize-a antes de iniciar outra.');
    } else {
      this.timer.start({ taskId: task.id, projectId: task.projectId, subjectId: task.subjectId });
      if (task.status === 'todo') this.tasks.setStatus(task.id, 'in_progress');
      this.toast.success('Cronômetro iniciado.');
    }
    this.router.navigate(['/timer']);
  }
}
