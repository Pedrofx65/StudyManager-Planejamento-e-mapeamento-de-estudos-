# 📚 Study Manager

Aplicação web para gerenciar **projetos, tarefas, matérias e tempo de estudo**, com dashboard de produtividade, quadro Kanban, cronômetro persistente e calendário de prazos.

Desenvolvida com **Angular 21** (componentes standalone, signals e change detection zoneless), **TypeScript** em modo estrito, **Bootstrap 5** e **Chart.js**. Os dados ficam salvos no **LocalStorage** do navegador.

---

## ✨ Funcionalidades

| Área | O que faz |
|---|---|
| **Dashboard** | Projetos, tarefas pendentes/concluídas, matérias em andamento, horas totais, progresso geral, próximos prazos, tarefas prioritárias e gráficos de horas por semana e tempo por matéria |
| **Projetos** | CRUD completo, filtros (status, prioridade, busca), ordenação e progresso calculado automaticamente pelas tarefas concluídas |
| **Tarefas** | CRUD, quadro **Kanban com arrastar e soltar** (Angular CDK), visão em lista, filtros por projeto, matéria, prioridade e prazo, tempo estimado × utilizado |
| **Matérias** | Cor de identificação, categoria, horas planejadas × estudadas, lista de conteúdos com marcação de concluído e percentual de conclusão |
| **Cronômetro** | Iniciar, pausar, continuar, finalizar e descartar; vínculo com matéria, projeto e tarefa; **continua contando ao trocar de página, recarregar ou fechar a aba** |
| **Histórico** | Sessões com data, horário, duração, conteúdo e observações; filtros por matéria, projeto e período; registro e edição manual |
| **Calendário** | Visão mensal com prazos de tarefas e projetos, provas, metas, sessões planejadas e realizadas; destaque de prazos próximos e atrasados |
| **Configurações** | Nome, tema claro/escuro, meta semanal, janela de "prazo próximo", backup em JSON (exportar/importar), dados de demonstração e limpeza |

## 🛠️ Tecnologias

- Angular 21 — standalone components, signals (`signal`, `computed`, `effect`), novo control flow (`@if`, `@for`), lazy loading de rotas, zoneless
- TypeScript (strict)
- Reactive Forms tipados com validadores customizados
- Angular CDK Drag & Drop
- Bootstrap 5 + Bootstrap Icons, com tema próprio via variáveis CSS
- Chart.js (registrando apenas os módulos usados)
- Vitest para testes unitários

## 🏗️ Arquitetura

```
src/app/
├── core/                  # Regras de negócio (singletons)
│   ├── models/            # Interfaces: Project, Task, Subject, StudySession, CalendarEvent, AppSettings
│   ├── services/          # StorageService, EntityStore (base) e serviços de domínio
│   └── utils/             # Datas, IDs, rótulos e validadores
├── layout/                # Sidebar e topbar (com mini-cronômetro)
├── shared/                # Componentes, pipes e diretivas reutilizáveis
│   ├── components/        # stat-card, progress-bar, empty-state, bar-chart, badges, confirm-dialog, toasts...
│   ├── forms/             # BaseForm (exibição de erros e envio)
│   └── pipes/             # duration, relativeDay
└── features/              # Uma pasta por página (carregadas sob demanda)
    ├── dashboard/  projects/  tasks/  subjects/
    └── timer/  history/  calendar/  settings/
```

**Fluxo de dados:** `Componentes → Serviços de domínio (signals) → StorageService → LocalStorage`

- Cada serviço de domínio estende `EntityStore<T>`, que mantém a coleção em um `signal` e grava no LocalStorage a cada alteração.
- Valores derivados (progresso, totais, quadro Kanban, itens do calendário) são `computed`, sempre consistentes com os dados.
- Apenas o `StorageService` acessa o LocalStorage. Trocar por uma API REST no futuro exige mudar só a camada de serviços.

### Decisões importantes

- **Cronômetro baseado em timestamps:** o serviço guarda o horário de início e o tempo acumulado, e não um contador. Assim o tempo continua correto ao navegar, recarregar ou fechar a aba.
- **Progresso do projeto** = % de tarefas concluídas.
- **Progresso da matéria** = % de conteúdos concluídos; sem conteúdos cadastrados, usa horas estudadas ÷ horas planejadas.
- **Progresso geral** = média das matérias ponderada pelas horas planejadas.
- **Exclusões não apagam histórico:** ao excluir um projeto ou uma matéria, as tarefas e sessões são mantidas e apenas desvinculadas.
- **Cores acessíveis:** a paleta sugerida para as matérias foi validada quanto a contraste e separação para daltonismo, nos temas claro e escuro.

## 🚀 Como executar

Pré-requisitos: **Node.js 20.19+ ou 22.12+** e npm.

```bash
npm install
npm start            # http://localhost:4200
```

Outros comandos:

```bash
npm run build        # build de produção em dist/
npm test             # testes unitários (Vitest)
```

> Para explorar rapidamente, abra **Configurações → Carregar dados de demonstração** (ou use o botão no dashboard vazio).

## 🧪 Testes

Os testes cobrem as regras de negócio centrais:

- `TaskService`: ordenação, movimentação no Kanban, data de conclusão, priorização
- Progresso de projetos e matérias, além da soma de tempo nas tarefas
- `TimerService`: pausas, restauração após recarregar, finalização e descarte

## 📄 Licença

Projeto pessoal para estudo e portfólio.
