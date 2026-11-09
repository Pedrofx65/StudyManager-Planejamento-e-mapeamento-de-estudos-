import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { AppSettings, DEFAULT_SETTINGS } from '../models';
import { STORAGE_KEYS, StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<AppSettings>(this.load());

  readonly settings = this.state.asReadonly();

  constructor() {
    // Aplica o tema sempre que a configuração mudar.
    effect(() => {
      const theme = this.state().theme;
      this.document.documentElement.setAttribute('data-bs-theme', theme);
      this.document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'dark' ? '#0d0e11' : '#f6f7f9');
    });
  }

  update(changes: Partial<AppSettings>): void {
    const next = { ...this.state(), ...changes };
    this.state.set(next);
    this.storage.write(STORAGE_KEYS.settings, next);
  }

  toggleTheme(): void {
    this.update({ theme: this.state().theme === 'dark' ? 'light' : 'dark' });
  }

  reload(): void {
    this.state.set(this.load());
  }

  private load(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...this.storage.read<Partial<AppSettings>>(STORAGE_KEYS.settings, {}) };
  }
}
