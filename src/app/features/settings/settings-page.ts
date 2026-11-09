import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ThemeMode } from '../../core/models';
import { ConfirmService } from '../../core/services/confirm.service';
import { DataService } from '../../core/services/data.service';
import { ProjectService } from '../../core/services/project.service';
import { SessionService } from '../../core/services/session.service';
import { SettingsService } from '../../core/services/settings.service';
import { SubjectService } from '../../core/services/subject.service';
import { TaskService } from '../../core/services/task.service';
import { CalendarEventService } from '../../core/services/calendar-event.service';
import { ToastService } from '../../core/services/toast.service';
import { todayString } from '../../core/utils/date.utils';
import { FieldError } from '../../shared/components/field-error';
import { PageHeader } from '../../shared/components/page-header';
import { BaseForm } from '../../shared/forms/base-form';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, PageHeader, FieldError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage extends BaseForm {
  private readonly settings = inject(SettingsService);
  private readonly data = inject(DataService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly projects = inject(ProjectService);
  private readonly tasks = inject(TaskService);
  private readonly subjects = inject(SubjectService);
  private readonly sessions = inject(SessionService);
  private readonly events = inject(CalendarEventService);

  readonly form = inject(FormBuilder).nonNullable.group({
    userName: [this.settings.settings().userName, Validators.maxLength(40)],
    theme: [this.settings.settings().theme as ThemeMode],
    weeklyGoalHours: [this.settings.settings().weeklyGoalHours, [Validators.required, Validators.min(0), Validators.max(168)]],
    upcomingDays: [this.settings.settings().upcomingDays, [Validators.required, Validators.min(1), Validators.max(60)]],
  });

  protected readonly counts = computed(() => [
    { label: 'Projetos', icon: 'bi-folder2', value: this.projects.items().length },
    { label: 'Tarefas', icon: 'bi-check2-square', value: this.tasks.items().length },
    { label: 'Matérias', icon: 'bi-book', value: this.subjects.items().length },
    { label: 'Sessões', icon: 'bi-stopwatch', value: this.sessions.items().length },
    { label: 'Eventos', icon: 'bi-calendar3', value: this.events.items().length },
  ]);

  constructor() {
    super();
    // Mantém o tema do formulário sincronizado com a sidebar.
    effect(() => this.form.controls.theme.setValue(this.settings.settings().theme, { emitEvent: false }));
  }

  protected save(): void {
    if (!this.validate()) return;
    const v = this.form.getRawValue();
    this.settings.update({
      userName: v.userName.trim(),
      theme: v.theme,
      weeklyGoalHours: Number(v.weeklyGoalHours),
      upcomingDays: Math.round(Number(v.upcomingDays)),
    });
    this.form.markAsPristine();
    this.toast.success('Configurações salvas.');
  }

  /** Aplica o tema imediatamente ao trocar a opção. */
  protected previewTheme(theme: ThemeMode): void {
    this.settings.update({ theme });
  }

  protected exportData(): void {
    const backup = this.data.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-manager-backup-${todayString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success('Backup exportado.');
  }

  protected async importData(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const ok = await this.confirm.ask({
      title: 'Importar backup',
      message: 'Os dados atuais serão substituídos pelos dados do arquivo. Deseja continuar?',
      confirmLabel: 'Importar',
      danger: true,
    });
    if (!ok) return;

    try {
      this.data.importBackup(JSON.parse(await file.text()) as unknown);
      this.resetForm();
      this.toast.success('Backup importado com sucesso.');
    } catch (error) {
      this.toast.error(error instanceof Error && !(error instanceof SyntaxError) ? error.message : 'Não foi possível ler o arquivo.');
    }
  }

  protected async loadDemo(): Promise<void> {
    if (this.data.hasAnyData()) {
      const ok = await this.confirm.ask({
        title: 'Carregar demonstração',
        message: 'Seus dados atuais serão substituídos por dados de exemplo. Exporte um backup antes, se quiser mantê-los.',
        confirmLabel: 'Substituir dados',
        danger: true,
      });
      if (!ok) return;
    }
    this.data.loadDemo();
    this.toast.success('Dados de demonstração carregados.');
  }

  protected async clearData(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Apagar todos os dados',
      message: 'Projetos, tarefas, matérias, sessões e eventos serão apagados permanentemente. Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar tudo',
      danger: true,
    });
    if (!ok) return;
    this.data.clearAll();
    this.toast.success('Todos os dados foram apagados.');
  }

  private resetForm(): void {
    const s = this.settings.settings();
    this.form.reset({ userName: s.userName, theme: s.theme, weeklyGoalHours: s.weeklyGoalHours, upcomingDays: s.upcomingDays });
  }
}
