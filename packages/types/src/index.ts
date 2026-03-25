// Shared Zod schemas and TypeScript types
// Single source of truth for all shared types between API and web frontend.
import { z } from "zod";

// ─── Budget Categories ─────────────────────────────────────────────────────────

export const BudgetCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  sort_order: z.number().int(),
  created_at: z.string(),
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  sort_order: z.number().int().default(0),
});

export type CreateCategory = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
});

export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

// ─── Master Budget Items ───────────────────────────────────────────────────────

export const MasterBudgetItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  default_amount: z.number(),
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MasterBudgetItem = z.infer<typeof MasterBudgetItemSchema>;

export const CreateMasterItemSchema = z.object({
  category_id: z.string().uuid(),
  name: z.string().min(1),
  default_amount: z.number().min(0).default(0),
  sort_order: z.number().int().default(0),
});

export type CreateMasterItem = z.infer<typeof CreateMasterItemSchema>;

export const UpdateMasterItemSchema = z.object({
  name: z.string().min(1).optional(),
  default_amount: z.number().min(0).optional(),
  sort_order: z.number().int().optional(),
});

export type UpdateMasterItem = z.infer<typeof UpdateMasterItemSchema>;

// ─── Master Budget Settings ────────────────────────────────────────────────────

export const MasterBudgetSettingsSchema = z.object({
  monthly_income: z.number(),
});

export type MasterBudgetSettings = z.infer<typeof MasterBudgetSettingsSchema>;

export const UpdateSettingsSchema = z.object({
  monthly_income: z.number().min(0),
});

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;

// ─── Master Budget (full response) ────────────────────────────────────────────

export const MasterBudgetCategoryWithItemsSchema = BudgetCategorySchema.extend({
  items: z.array(MasterBudgetItemSchema),
});

export type MasterBudgetCategoryWithItems = z.infer<typeof MasterBudgetCategoryWithItemsSchema>;

export const MasterBudgetResponseSchema = z.object({
  settings: MasterBudgetSettingsSchema,
  categories: z.array(MasterBudgetCategoryWithItemsSchema),
});

export type MasterBudgetResponse = z.infer<typeof MasterBudgetResponseSchema>;

// ─── Monthly Budgets ───────────────────────────────────────────────────────────

export const MonthlyBudgetSchema = z.object({
  id: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  status: z.enum(["open", "closed"]),
  income: z.number(),
  created_at: z.string(),
});
export type MonthlyBudget = z.infer<typeof MonthlyBudgetSchema>;

export const CreateMonthlyBudgetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type CreateMonthlyBudget = z.infer<typeof CreateMonthlyBudgetSchema>;

export const UpdateMonthlyBudgetSchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  income: z.number().min(0).optional(),
});
export type UpdateMonthlyBudget = z.infer<typeof UpdateMonthlyBudgetSchema>;

export const MonthlyBudgetItemSchema = z.object({
  id: z.string().uuid(),
  category_name: z.string(),
  item_name: z.string(),
  budgeted_amount: z.number(),
  created_at: z.string(),
});
export type MonthlyBudgetItem = z.infer<typeof MonthlyBudgetItemSchema>;

export const UpdateMonthlyBudgetItemSchema = z.object({
  budgeted_amount: z.number().min(0),
});
export type UpdateMonthlyBudgetItem = z.infer<typeof UpdateMonthlyBudgetItemSchema>;

export const MonthlyBudgetOverviewSchema = z.object({
  income: z.number(),
  total_budgeted: z.number(),
  variable_room: z.number(),
  total_transactions: z.number(),
  actual_remaining: z.number(),
});
export type MonthlyBudgetOverview = z.infer<typeof MonthlyBudgetOverviewSchema>;

export const MonthlyBudgetDetailSchema = MonthlyBudgetSchema.extend({
  items: z.array(MonthlyBudgetItemSchema),
  overview: MonthlyBudgetOverviewSchema,
});
export type MonthlyBudgetDetail = z.infer<typeof MonthlyBudgetDetailSchema>;
