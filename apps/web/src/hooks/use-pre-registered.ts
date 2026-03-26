import type {
  CreatePreRegisteredEntry,
  PreRegisteredEntry,
  UpdatePreRegisteredEntry,
} from "@personal/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

const PRE_REG_KEY = ["budget", "pre-registered"] as const;

export function usePreRegistered() {
  return useQuery<PreRegisteredEntry[]>({
    queryKey: PRE_REG_KEY,
    queryFn: () =>
      api.get<PreRegisteredEntry[]>("/api/v1/budget/pre-registered"),
  });
}

export function useCreatePreRegistered(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (body: CreatePreRegisteredEntry) =>
      api.post("/api/v1/budget/pre-registered", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRE_REG_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useUpdatePreRegistered(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdatePreRegisteredEntry) =>
      api.put(`/api/v1/budget/pre-registered/${id}`, body),
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: PRE_REG_KEY });
      const previous =
        queryClient.getQueryData<PreRegisteredEntry[]>(PRE_REG_KEY);
      queryClient.setQueryData<PreRegisteredEntry[]>(PRE_REG_KEY, (old) => {
        if (!old) {
          return old;
        }
        return old.map((entry) => {
          if (entry.id === id) {
            return { ...entry, ...patch } as typeof entry;
          }
          return entry;
        });
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(PRE_REG_KEY, ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRE_REG_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useDeletePreRegistered(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/budget/pre-registered/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRE_REG_KEY });
      opts?.onSuccess?.();
    },
  });
}
