import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  BudgetCategorySchema,
  CreateCategorySchema,
  CreateMasterItemSchema,
  MasterBudgetItemSchema,
  MasterBudgetResponseSchema,
  MasterBudgetSettingsSchema,
  UpdateCategorySchema,
  UpdateMasterItemSchema,
  UpdateSettingsSchema,
} from "@personal/types";
import { supabase } from "../lib/supabase";
import { type AppVariables, requireRole } from "../middleware/auth";

export const masterBudgetRouter = new OpenAPIHono<{
  Variables: AppVariables;
}>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z
  .object({ error: z.string() })
  .openapi("MasterBudgetError");

const IdParamSchema = z.object({ id: z.string().uuid() });

// ─── GET /budget/master ────────────────────────────────────────────────────────

masterBudgetRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/master",
    tags: ["Master Budget"],
    summary: "Get full master budget — categories, items, and income setting",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Full master budget",
        content: { "application/json": { schema: MasterBudgetResponseSchema } },
      },
    },
  }),
  async (c) => {
    const [categoriesResult, itemsResult, settingsResult] = await Promise.all([
      supabase.from("budget_categories").select("*").order("sort_order"),
      supabase.from("master_budget_items").select("*").order("sort_order"),
      supabase.from("master_budget_settings").select("*").limit(1),
    ]);

    const categories = (categoriesResult.data ?? []).map((cat) => ({
      ...cat,
      items: (itemsResult.data ?? [])
        .filter((item) => item.category_id === cat.id)
        .map(({ category_id: _c, ...item }) => item),
    }));

    const settings = settingsResult.data?.[0]
      ? { monthly_income: Number(settingsResult.data[0].monthly_income) }
      : { monthly_income: 0 };

    return c.json({ settings, categories }, 200 as const);
  }
);

// ─── POST /budget/master/categories ───────────────────────────────────────────

masterBudgetRouter.use("/budget/master/categories", requireRole("admin"));
masterBudgetRouter.use("/budget/master/categories/:id", requireRole("admin"));

masterBudgetRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/master/categories",
    tags: ["Master Budget"],
    summary: "Create a budget category [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: CreateCategorySchema } },
      },
    },
    responses: {
      201: {
        description: "Created category",
        content: { "application/json": { schema: BudgetCategorySchema } },
      },
      400: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");
    const { data, error } = await supabase
      .from("budget_categories")
      .insert({ name: body.name, sort_order: body.sort_order })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create category" }, 400 as const);
    }

    return c.json(data, 201 as const);
  }
);

// ─── PUT /budget/master/categories/:id ────────────────────────────────────────

masterBudgetRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/master/categories/{id}",
    tags: ["Master Budget"],
    summary: "Update a budget category [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        required: true,
        content: { "application/json": { schema: UpdateCategorySchema } },
      },
    },
    responses: {
      200: {
        description: "Updated category",
        content: { "application/json": { schema: BudgetCategorySchema } },
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("budget_categories")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Category not found" }, 404 as const);
    }

    return c.json(data, 200 as const);
  }
);

// ─── DELETE /budget/master/categories/:id ─────────────────────────────────────

masterBudgetRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/master/categories/{id}",
    tags: ["Master Budget"],
    summary: "Delete a budget category and its items [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const { error, count } = await supabase
      .from("budget_categories")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error || count === 0) {
      return c.json({ error: "Category not found" }, 404 as const);
    }

    return new Response(null, { status: 204 });
  }
);

// ─── POST /budget/master/items ─────────────────────────────────────────────────

masterBudgetRouter.use("/budget/master/items", requireRole("admin"));
masterBudgetRouter.use("/budget/master/items/:id", requireRole("admin"));

masterBudgetRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/master/items",
    tags: ["Master Budget"],
    summary: "Create a master budget line item [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: CreateMasterItemSchema } },
      },
    },
    responses: {
      201: {
        description: "Created item",
        content: { "application/json": { schema: MasterBudgetItemSchema } },
      },
      404: {
        description: "Category not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      400: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid("json");

    // Verify category exists
    const { data: category } = await supabase
      .from("budget_categories")
      .select("id")
      .eq("id", body.category_id)
      .single();

    if (!category) {
      return c.json({ error: "Category not found" }, 404 as const);
    }

    const { data, error } = await supabase
      .from("master_budget_items")
      .insert({
        category_id: body.category_id,
        name: body.name,
        default_amount: body.default_amount,
        sort_order: body.sort_order,
      })
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create item" }, 400 as const);
    }

    const { category_id: _c, ...item } = data;
    return c.json(item, 201 as const);
  }
);

// ─── PUT /budget/master/items/:id ─────────────────────────────────────────────

masterBudgetRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/master/items/{id}",
    tags: ["Master Budget"],
    summary: "Update a master budget line item [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: {
        required: true,
        content: { "application/json": { schema: UpdateMasterItemSchema } },
      },
    },
    responses: {
      200: {
        description: "Updated item",
        content: { "application/json": { schema: MasterBudgetItemSchema } },
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("master_budget_items")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Item not found" }, 404 as const);
    }

    const { category_id: _c, ...item } = data;
    return c.json(item, 200 as const);
  }
);

// ─── DELETE /budget/master/items/:id ──────────────────────────────────────────

masterBudgetRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/master/items/{id}",
    tags: ["Master Budget"],
    summary: "Delete a master budget line item [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const { error, count } = await supabase
      .from("master_budget_items")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error || count === 0) {
      return c.json({ error: "Item not found" }, 404 as const);
    }

    return new Response(null, { status: 204 });
  }
);

// ─── PUT /budget/master/settings ──────────────────────────────────────────────

masterBudgetRouter.use("/budget/master/settings", requireRole("admin"));

masterBudgetRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/master/settings",
    tags: ["Master Budget"],
    summary: "Update monthly income setting [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: UpdateSettingsSchema } },
      },
    },
    responses: {
      200: {
        description: "Updated settings",
        content: { "application/json": { schema: MasterBudgetSettingsSchema } },
      },
      400: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { monthly_income } = c.req.valid("json");

    // Get existing row id if any
    const { data: existing } = await supabase
      .from("master_budget_settings")
      .select("id")
      .limit(1)
      .single();

    let result: { monthly_income: number } | null = null;

    if (existing) {
      const { data } = await supabase
        .from("master_budget_settings")
        .update({ monthly_income })
        .eq("id", existing.id)
        .select("monthly_income")
        .single();
      result = data ? { monthly_income: Number(data.monthly_income) } : null;
    } else {
      const { data } = await supabase
        .from("master_budget_settings")
        .insert({ monthly_income })
        .select("monthly_income")
        .single();
      result = data ? { monthly_income: Number(data.monthly_income) } : null;
    }

    if (!result) {
      return c.json({ error: "Failed to update settings" }, 400 as const);
    }

    return c.json(result, 200 as const);
  }
);
