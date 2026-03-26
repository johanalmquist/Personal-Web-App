import type { CreateTag, Tag } from "@personal/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

const TAGS_KEY = ["budget", "tags"] as const;

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: TAGS_KEY,
    queryFn: () => api.get<Tag[]>("/api/v1/budget/tags"),
  });
}

export function useCreateTag(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (body: CreateTag) => api.post("/api/v1/budget/tags", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      opts?.onSuccess?.();
    },
  });
}

export function useDeleteTag(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/budget/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      opts?.onSuccess?.();
    },
  });
}
