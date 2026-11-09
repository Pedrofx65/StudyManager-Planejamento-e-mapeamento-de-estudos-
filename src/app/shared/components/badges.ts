import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Priority, ProjectStatus, TaskStatus } from '../../core/models';
import {
  PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  optionMeta,
} from '../../core/utils/labels';

@Component({
  selector: 'app-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sm-chip" [class]="meta().tone"><i class="bi" [class]="meta().icon"></i>{{ meta().label }}</span>`,
})
export class PriorityBadge {
  readonly value = input.required<Priority>();
  protected readonly meta = computed(() => optionMeta(PRIORITY_OPTIONS, this.value()));
}

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sm-chip" [class]="meta().tone"><i class="bi" [class]="meta().icon"></i>{{ meta().label }}</span>`,
})
export class StatusBadge {
  readonly value = input.required<ProjectStatus | TaskStatus>();
  readonly kind = input<'project' | 'task'>('task');
  protected readonly meta = computed(() =>
    this.kind() === 'project'
      ? optionMeta(PROJECT_STATUS_OPTIONS, this.value() as ProjectStatus)
      : optionMeta(TASK_STATUS_OPTIONS, this.value() as TaskStatus),
  );
}
