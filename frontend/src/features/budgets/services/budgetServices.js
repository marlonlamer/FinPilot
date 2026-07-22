import { api } from "../../../services/api";

export const budgetService = {
  getBudgets() {
    return api.get("/budgets");
  },
};