/**
 * Finance API hooks — barrel re-export.
 *
 * Usage:
 *   import { useMasterBudget, useCreateCategory } from '@/hooks'
 *
 *   function MasterBudgetPage() {
 *     const { data, isPending } = useMasterBudget();
 *     const createCategory = useCreateCategory({ onSuccess: () => void 0 });
 *     // ...
 *   }
 */

// biome-ignore lint/performance/noBarrelFile: intentional barrel for @/hooks alias
export * from "./use-master-budget";
export * from "./use-monthly-budgets";
export * from "./use-pre-registered";
export * from "./use-tags";
export * from "./use-transactions";
