export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2', path: '/dashboard' },
  { label: 'Meus projetos', icon: 'bi-folder2', path: '/projects' },
  { label: 'Minhas tarefas', icon: 'bi-check2-square', path: '/tasks' },
  { label: 'Matérias', icon: 'bi-book', path: '/subjects' },
  { label: 'Cronômetro', icon: 'bi-stopwatch', path: '/timer' },
  { label: 'Histórico', icon: 'bi-clock-history', path: '/history' },
  { label: 'Calendário', icon: 'bi-calendar3', path: '/calendar' },
  { label: 'Configurações', icon: 'bi-gear', path: '/settings' },
];
