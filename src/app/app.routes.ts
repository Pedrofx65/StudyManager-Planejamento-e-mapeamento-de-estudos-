import { Routes } from '@angular/router';

const title = (page: string): string => `${page} · Study Manager`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'subjects' },
  {
    path: 'subjects',
    children: [
      { path: '', title: title('Matérias'), loadComponent: () => import('./features/subjects/subject-list').then((m) => m.SubjectList) },
      { path: 'new', title: title('Nova matéria'), loadComponent: () => import('./features/subjects/subject-form').then((m) => m.SubjectForm) },
      { path: ':id', title: title('Matéria'), loadComponent: () => import('./features/subjects/subject-detail').then((m) => m.SubjectDetail) },
      { path: ':id/edit', title: title('Editar matéria'), loadComponent: () => import('./features/subjects/subject-form').then((m) => m.SubjectForm) },
    ],
  },
  { path: '**', redirectTo: '' },
];
