import type {
  CreateMonthlyBudget,
  MonthlyBudget,
  MonthlyBudgetDetail,
  UpdateMonthlyBudget,
  UpdateMonthlyBudgetItem,
} from "@personal/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

const MONTHLY_LIST_KEY = ["budget", "monthly"] as const;
const monthlyDetailKey = (id: string) => ["budget", "monthly", id] as const;

export function useMonthlyBudgets() {
  return useQuery<MonthlyBudget[]>({
    queryKey: MONTHLY_LIST_KEY,
    queryFn: () => api.get<MonthlyBudget[]>("/api/v1/budget/monthly"),
  });
}

export function useMonthlyBudget(id: string) {
  return useQuery<MonthlyBudgetDetail>({
    queryKey: monthlyDetailKey(id),
    queryFn: () => api.get<MonthlyBudgetDetail>(`/api/v1/budget/monthly/${id}`),
    enabled: !!id,
  });
}

export function useCreateMonthlyBudget(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (body: CreateMonthlyBudget) =>
      api.post("/api/v1/budget/monthly", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_LIST_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useUpdateMonthlyBudget(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateMonthlyBudget) =>
      api.put(`/api/v1/budget/monthly/${id}`, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: monthlyDetailKey(id) });
      opts?.onSuccess?.();
    },
  });
}

export function useOverrideLineItem(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      budgetId,
      itemId,
      ...body
    }: { budgetId: string; itemId: string } & UpdateMonthlyBudgetItem) =>
      api.put(`/api/v1/budget/monthly/${budgetId}/items/${itemId}`, body),
    onMutate: async ({ budgetId, itemId, ...patch }) => {
      const key = monthlyDetailKey(budgetId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MonthlyBudgetDetail>(key);
      queryClient.setQueryData<MonthlyBudgetDetail>(key, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          items: old.items.map((item) => {
            if (item.id === itemId) {
              return { ...item, ...patch } as typeof item;
            }
            return item;
          }),
        };
      });
      return { previous };
    },
    onError: (_err, { budgetId }, ctx) => {
      queryClient.setQueryData(monthlyDetailKey(budgetId), ctx?.previous);
    },
    onSettled: (_data, _err, { budgetId }) => {
      queryClient.invalidateQueries({ queryKey: monthlyDetailKey(budgetId) });
      opts?.onSuccess?.();
    },
  });
}
