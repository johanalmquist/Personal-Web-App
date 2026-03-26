import type {
  AttachmentResponse,
  CreateTransaction,
  TransactionWithBalance,
  UpdateTransaction,
} from "@personal/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";

const txKey = (monthlyBudgetId: string) =>
  ["budget", "monthly", monthlyBudgetId, "transactions"] as const;

export function useTransactions(monthlyBudgetId: string) {
  return useQuery<TransactionWithBalance[]>({
    queryKey: txKey(monthlyBudgetId),
    queryFn: () =>
      api.get<TransactionWithBalance[]>(
        `/api/v1/budget/monthly/${monthlyBudgetId}/transactions`
      ),
    enabled: !!monthlyBudgetId,
  });
}

export function useCreateTransaction(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      monthlyBudgetId,
      ...body
    }: { monthlyBudgetId: string } & CreateTransaction) =>
      api.post(`/api/v1/budget/monthly/${monthlyBudgetId}/transactions`, body),
    onSuccess: (_data, { monthlyBudgetId }) => {
      queryClient.invalidateQueries({ queryKey: txKey(monthlyBudgetId) });
      opts?.onSuccess?.();
    },
  });
}

export function useUpdateTransaction(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      monthlyBudgetId,
      txId,
      ...body
    }: { monthlyBudgetId: string; txId: string } & UpdateTransaction) =>
      api.put(
        `/api/v1/budget/monthly/${monthlyBudgetId}/transactions/${txId}`,
        body
      ),
    onSuccess: (_data, { monthlyBudgetId }) => {
      queryClient.invalidateQueries({ queryKey: txKey(monthlyBudgetId) });
      opts?.onSuccess?.();
    },
  });
}

export function useDeleteTransaction(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      monthlyBudgetId,
      txId,
    }: {
      monthlyBudgetId: string;
      txId: string;
    }) =>
      api.delete(
        `/api/v1/budget/monthly/${monthlyBudgetId}/transactions/${txId}`
      ),
    onSuccess: (_data, { monthlyBudgetId }) => {
      queryClient.invalidateQueries({ queryKey: txKey(monthlyBudgetId) });
      opts?.onSuccess?.();
    },
  });
}

export function useUploadAttachment(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      monthlyBudgetId,
      txId,
      formData,
    }: {
      monthlyBudgetId: string;
      txId: string;
      formData: FormData;
    }) =>
      api.upload<AttachmentResponse>(
        `/api/v1/budget/monthly/${monthlyBudgetId}/transactions/${txId}/attachment`,
        formData
      ),
    onSuccess: (_data, { monthlyBudgetId }) => {
      queryClient.invalidateQueries({ queryKey: txKey(monthlyBudgetId) });
      opts?.onSuccess?.();
    },
  });
}

export function useDeleteAttachment(opts?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({
      monthlyBudgetId,
      txId,
    }: {
      monthlyBudgetId: string;
      txId: string;
    }) =>
      api.delete(
        `/api/v1/budget/monthly/${monthlyBudgetId}/transactions/${txId}/attachment`
      ),
    onSuccess: (_data, { monthlyBudgetId }) => {
      queryClient.invalidateQueries({ queryKey: txKey(monthlyBudgetId) });
      opts?.onSuccess?.();
    },
  });
}
