import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { TimerService } from './timer.service';

describe('TimerService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T10:00:00'));
    TestBed.configureTestingModule({});
  });

  afterEach(() => vi.useRealTimers());

  it('conta apenas o tempo em execução, ignorando pausas', () => {
    const timer = TestBed.inject(TimerService);
    timer.start();
    vi.advanceTimersByTime(10 * 60_000);
    timer.pause();
    vi.advanceTimersByTime(5 * 60_000);
    expect(timer.elapsedSeconds()).toBe(600);
    timer.resume();
    vi.advanceTimersByTime(2 * 60_000);
    expect(timer.elapsedSeconds()).toBe(720);
  });

  it('restaura uma sessão em andamento após recarregar a página', () => {
    TestBed.inject(TimerService).start();
    vi.advanceTimersByTime(90_000);

    // Simula um novo carregamento da aplicação lendo o estado salvo.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(TimerService);

    expect(restored.status()).toBe('running');
    vi.advanceTimersByTime(30_000);
    expect(restored.elapsedSeconds()).toBe(120);
  });

  it('registra a sessão ao finalizar com conteúdo e observações', () => {
    const timer = TestBed.inject(TimerService);
    const sessions = TestBed.inject(SessionService);
    timer.setSelection({ subjectId: 'mat-1' });
    timer.start();
    timer.setDraft({ content: '  Crase ', notes: 'revisar' });
    vi.advanceTimersByTime(25 * 60_000);

    const session = timer.finish();

    expect(session?.durationSeconds).toBe(1500);
    expect(session?.content).toBe('Crase');
    expect(session?.subjectId).toBe('mat-1');
    expect(sessions.items()).toHaveLength(1);
    expect(timer.status()).toBe('idle');
    expect(timer.content()).toBe('');
  });

  it('descarta sem registrar', () => {
    const timer = TestBed.inject(TimerService);
    timer.start();
    vi.advanceTimersByTime(60_000);
    timer.discard();
    expect(TestBed.inject(SessionService).items()).toHaveLength(0);
    expect(timer.elapsedSeconds()).toBe(0);
  });
});
