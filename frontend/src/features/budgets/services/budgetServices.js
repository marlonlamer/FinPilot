import { api } from "../../../services/api";

export const budgetService = {
  async getBudgets(monthkey) {
    return api.get("/budgets", {
      params: { month: monthkey },
    });
  },

  mapBudgets(list) {
    const budgets = {};
    const meta = {};

    if (Array.isArray(list)) {
      list.forEach((b) => {
        budgets[b.category] = Number(b.budgetLimit || 0);

        meta[b.category] = {
          id: b.id,
          budgetSpent: Number(b.budgetSpent || 0),
          budgetRemaining: Number(b.budgetRemaining || 0),
          month: b.month,
        };
      });
    }

    return { budgets, meta };
  },
};