/** Five fixed tasks. No task CRUD in the prototype — that is T11. */
export type Task = { id: string; name: string; weight: number };

export const TASKS: readonly Task[] = [
  { id: "deep-work", name: "Trabalho focado", weight: 3 },
  { id: "exercise", name: "Exercício", weight: 2 },
  { id: "study", name: "Estudar", weight: 2 },
  { id: "reading", name: "Leitura", weight: 1 },
  { id: "tidy", name: "Arrumar a casa", weight: 1 },
];

export const TOTAL_WEIGHT = TASKS.reduce((sum, t) => sum + t.weight, 0);
