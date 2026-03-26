import type {
  CreateCategory,
  CreateMasterItem,
  MasterBudgetResponse,
  UpdateCategory,
  UpdateMasterItem,
} from "@personal/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

const MASTER_KEY = ["budget", "master"] as const;

export function useMasterBudget() {
  return useQuery<MasterBudgetResponse>({
    queryKey: MASTER_KEY,
    queryFn: () => api.get<MasterBudgetResponse>("/api/v1/budget/master"),
  });
}

export function useCreateCategory(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (body: CreateCategory) =>
      api.post("/api/v1/budget/master/categories", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useUpdateCategory(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateCategory) =>
      api.put(`/api/v1/budget/master/categories/${id}`, body),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: MASTER_KEY });
      const previous =
        queryClient.getQueryData<MasterBudgetResponse>(MASTER_KEY);
      queryClient.setQueryData<MasterBudgetResponse>(MASTER_KEY, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          categories: old.categories.map((c) => {
            if (c.id === id) {
              return { ...c, ...patch } as typeof c;
            }
            return c;
          }),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(MASTER_KEY, ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useDeleteCategory(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/budget/master/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useCreateMasterItem(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (body: CreateMasterItem) =>
      api.post("/api/v1/budget/master/items", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useUpdateMasterItem(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateMasterItem) =>
      api.put(`/api/v1/budget/master/items/${id}`, body),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: MASTER_KEY });
      const previous =
        queryClient.getQueryData<MasterBudgetResponse>(MASTER_KEY);
      queryClient.setQueryData<MasterBudgetResponse>(MASTER_KEY, (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          categories: old.categories.map((c) => ({
            ...c,
            items: c.items.map((item) => {
              if (item.id === id) {
                return { ...item, ...patch } as typeof item;
              }
              return item;
            }),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(MASTER_KEY, ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useDeleteMasterItem(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/budget/master/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MASTER_KEY });
      opts?.onSuccess?.();
    },
  });
}
