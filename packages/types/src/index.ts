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
