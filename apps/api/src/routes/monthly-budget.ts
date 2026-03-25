import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CreateMonthlyBudgetSchema,
  MonthlyBudgetDetailSchema,
  MonthlyBudgetItemSchema,
  MonthlyBudgetSchema,
  UpdateMonthlyBudgetItemSchema,
  UpdateMonthlyBudgetSchema,
} from "@personal/types";
import { supabase } from "../lib/supabase";
import { type AppVariables, requireRole } from "../middleware/auth";

export const monthlyBudgetRouter = new OpenAPIHono<{ Variables: AppVariables }>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("MonthlyBudgetError");
const IdParamSchema = z.object({ id: z.string().uuid() });
const ItemParamSchema = z.object({ id: z.string().uuid(), itemId: z.string().uuid() });

// ─── GET /budget/monthly ───────────────────────────────────────────────────────

monthlyBudgetRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/monthly",
    tags: ["Monthly Budget"],
    summary: "List all monthly budgets",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "List of monthly budgets",
        content: { "application/json": { schema: z.array(MonthlyBudgetSchema) } },
      },
    },
  }),
  async (c) => {
    const { data } = await supabase
      .from("monthly_budgets")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    const budgets = (data ?? []).map((b) => ({
      ...b,
      income: Number(b.income),
    }));

    return c.json(budgets, 200 as const);
  },
);

// ─── POST /budget/monthly ──────────────────────────────────────────────────────

monthlyBudgetRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/monthly",
    tags: ["Monthly Budget"],
    summary: "Create a monthly budget — snapshots master budget [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: { required: true, content: { "application/json": { schema: CreateMonthlyBudgetSchema } } },
    },
    responses: {
      201: {
        description: "Created monthly budget",
        content: { "application/json": { schema: MonthlyBudgetSchema } },
      },
      409: { description: "Monthly budget for this year/month already exists", content: { "application/json": { schema: ErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      400: { description: "Validation error", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { year, month } = c.req.valid("json");

    // Check for duplicate year/month
    const { data: existing } = await supabase
      .from("monthly_budgets")
      .select("id")
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (existing) {
      return c.json({ error: "Monthly budget for this year/month already exists" }, 409 as const);
    }

    // Fetch master settings and items in parallel
    const [settingsResult, itemsResult] = await Promise.all([
      supabase.from("master_budget_settings").select("monthly_income").limit(1),
      supabase
        .from("master_budget_items")
        .select("id, name, default_amount, budget_categories(name)")
        .order("sort_order"),
    ]);

    const income = Number(settingsResult.data?.[0]?.monthly_income ?? 0);

    // Create the monthly budget row
    const { data: budget, error: budgetError } = await supabase
      .from("monthly_budgets")
      .insert({ year, month, income })
      .select()
      .single();

    if (budgetError || !budget) {
      return c.json({ error: "Failed to create monthly budget" }, 400 as const);
    }

    // Bulk-insert snapshot items (if any master items exist)
    const masterItems = itemsResult.data ?? [];
    if (masterItems.length > 0) {
      const snapshotItems = masterItems.map((item) => ({
        monthly_budget_id: budget.id,
        master_item_id: item.id,
        category_name: (item.budget_categories as unknown as { name: string } | null)?.name ?? "Unknown",
        item_name: item.name,
        budgeted_amount: item.default_amount,
      }));

      await supabase.from("monthly_budget_items").insert(snapshotItems);
    }

    // Auto-import pre-registered entries for this year/month
    const { data: entries } = await supabase
      .from("pre_registered_entries")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .eq("imported", false);

    if (entries && entries.length > 0) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-01`;
      const txInserts = entries.map((e) => ({
        monthly_budget_id: budget.id,
        date: dateStr,
        description: e.description,
        type: e.type,
        amount: e.amount,
      }));

      const { data: insertedTxs } = await supabase
        .from("transactions")
        .insert(txInserts)
        .select("id");

      if (insertedTxs) {
        const tagRows = entries
          .map((e, i) =>
            e.tag_id && insertedTxs[i]
              ? { tag_id: e.tag_id, transaction_id: insertedTxs[i].id }
              : null,
          )
          .filter((r): r is { tag_id: string; transaction_id: string } => r !== null);

        if (tagRows.length > 0) {
          await supabase.from("transaction_tags").insert(tagRows);
        }
      }

      await supabase
        .from("pre_registered_entries")
        .update({ imported: true })
        .in("id", entries.map((e) => e.id));
    }

    return c.json({ ...budget, income: Number(budget.income) }, 201 as const);
  },
);

// ─── GET /budget/monthly/:id ───────────────────────────────────────────────────

monthlyBudgetRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/monthly/{id}",
    tags: ["Monthly Budget"],
    summary: "Get monthly budget with items and computed overview totals",
    security: [{ BearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: "Monthly budget detail",
        content: { "application/json": { schema: MonthlyBudgetDetailSchema } },
      },
      404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const [budgetResult, itemsResult, expensesResult] = await Promise.all([
      supabase.from("monthly_budgets").select("*").eq("id", id).single(),
      supabase.from("monthly_budget_items").select("*").eq("monthly_budget_id", id),
      supabase
        .from("transactions")
        .select("amount")
        .eq("monthly_budget_id", id)
        .eq("type", "expense"),
    ]);

    if (budgetResult.error || !budgetResult.data) {
      return c.json({ error: "Monthly budget not found" }, 404 as const);
    }

    const budget = budgetResult.data;
    const items = itemsResult.data ?? [];
    const expenses = expensesResult.data ?? [];

    const income = Number(budget.income);
    const total_budgeted = items.reduce((sum, i) => sum + Number(i.budgeted_amount), 0);
    const variable_room = income - total_budgeted;
    const total_transactions = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const actual_remaining = variable_room - total_transactions;

    const mappedItems = items.map(
      ({ monthly_budget_id: _mb, master_item_id: _mi, ...item }) => ({
        ...item,
        budgeted_amount: Number(item.budgeted_amount),
      }),
    );

    return c.json(
      {
        ...budget,
        income,
        items: mappedItems,
        overview: { income, total_budgeted, variable_room, total_transactions, actual_remaining },
      },
      200 as const,
    );
  },
);

// ─── PUT /budget/monthly/:id ───────────────────────────────────────────────────

monthlyBudgetRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/monthly/{id}",
    tags: ["Monthly Budget"],
    summary: "Update monthly budget status or income [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { required: true, content: { "application/json": { schema: UpdateMonthlyBudgetSchema } } },
    },
    responses: {
      200: {
        description: "Updated monthly budget",
        content: { "application/json": { schema: MonthlyBudgetSchema } },
      },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("monthly_budgets")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Monthly budget not found" }, 404 as const);
    }

    return c.json({ ...data, income: Number(data.income) }, 200 as const);
  },
);

// ─── PUT /budget/monthly/:id/items/:itemId ─────────────────────────────────────

monthlyBudgetRouter.use("/budget/monthly/:id/items/:itemId", requireRole("admin"));

monthlyBudgetRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/monthly/{id}/items/{itemId}",
    tags: ["Monthly Budget"],
    summary: "Override a line item's budgeted amount for this month [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: ItemParamSchema,
      body: { required: true, content: { "application/json": { schema: UpdateMonthlyBudgetItemSchema } } },
    },
    responses: {
      200: {
        description: "Updated line item",
        content: { "application/json": { schema: MonthlyBudgetItemSchema } },
      },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const { id, itemId } = c.req.valid("param");
    const { budgeted_amount } = c.req.valid("json");

    const { data, error } = await supabase
      .from("monthly_budget_items")
      .update({ budgeted_amount })
      .eq("id", itemId)
      .eq("monthly_budget_id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Line item not found" }, 404 as const);
    }

    const { monthly_budget_id: _mb, master_item_id: _mi, ...item } = data;
    return c.json({ ...item, budgeted_amount: Number(item.budgeted_amount) }, 200 as const);
  },
);
