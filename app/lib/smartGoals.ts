export type SmartGoal = {
  id: string;
  input: string; // original user text
  title: string;
  summary: string;
  category: "learning" | "finance" | "health" | "goals" | "tasks";
  simple?: boolean;
  plan: { step: string; timeframe: string; done: boolean }[];
  financeGoal?: {
    monthlyAmount: number;
    targetTotal?: number;
    timeframeMonths?: number;
    purpose: string;
  };
  tags: string[];
  createdAt: string;
};

export const STORAGE_KEY = "dashboard-smart-goals";

export function loadGoals(): SmartGoal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGoals(goals: SmartGoal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}
