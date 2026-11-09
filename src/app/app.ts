import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './core/services/settings.service';
import { Sidebar } from './layout/sidebar';
import { Topbar } from './layout/topbar';
import { ConfirmDialog } from './shared/components/confirm-dialog';
import { ToastContainer } from './shared/components/toast-container';

/** Shell da aplicação: sidebar, topbar, conteúdo e camadas globais (toasts e diálogos). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Topbar, ConfirmDialog, ToastContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Instancia o serviço cedo para aplicar o tema salvo.
  private readonly settings = inject(SettingsService);
  protected readonly sidebarOpen = signal(false);
}
