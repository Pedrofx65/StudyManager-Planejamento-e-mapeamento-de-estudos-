import { Routes } from '@angular/router';

const title = (page: string): string => `${page} · Study Manager`;

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  {
    path: 'projects',
    children: [
      { path: '', title: title('Projetos'), loadComponent: () => import('./features/projects/project-list').then((m) => m.ProjectList) },
      { path: 'new', title: title('Novo projeto'), loadComponent: () => import('./features/projects/project-form').then((m) => m.ProjectForm) },
      { path: ':id', title: title('Projeto'), loadComponent: () => import('./features/projects/project-detail').then((m) => m.ProjectDetail) },
      { path: ':id/edit', title: title('Editar projeto'), loadComponent: () => import('./features/projects/project-form').then((m) => m.ProjectForm) },
    ],
  },
  {
    path: 'tasks',
    children: [
      { path: '', title: title('Tarefas'), loadComponent: () => import('./features/tasks/tasks-page').then((m) => m.TasksPage) },
      { path: 'new', title: title('Nova tarefa'), loadComponent: () => import('./features/tasks/task-form').then((m) => m.TaskForm) },
      { path: ':id/edit', title: title('Editar tarefa'), loadComponent: () => import('./features/tasks/task-form').then((m) => m.TaskForm) },
      { path: ':id', redirectTo: ':id/edit' },
    ],
  },
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
