import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CreatePreRegisteredEntrySchema,
  PreRegisteredEntrySchema,
  UpdatePreRegisteredEntrySchema,
} from "@personal/types";
import { supabase } from "../lib/supabase";
import { type AppVariables, requireRole } from "../middleware/auth";

export const preRegisteredRouter = new OpenAPIHono<{ Variables: AppVariables }>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("PreRegisteredError");
const IdParamSchema = z.object({ id: z.string().uuid() });

// ─── Helper ────────────────────────────────────────────────────────────────────

interface EntryRow {
  amount: unknown;
  category_id: string | null;
  created_at: string;
  description: string;
  id: string;
  imported: boolean;
  month: number;
  tag_id: string | null;
  type: "income" | "expense";
  year: number;
}

function mapEntry(row: EntryRow) {
  return { ...row, amount: Number(row.amount) };
}

// ─── GET /budget/pre-registered ───────────────────────────────────────────────

preRegisteredRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/pre-registered",
    tags: ["Pre-registered Entries"],
    summary: "List all pre-registered entries",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "List of pre-registered entries",
        content: { "application/json": { schema: z.array(PreRegisteredEntrySchema) } },
      },
    },
  }),
  async (c) => {
    const { data } = await supabase
      .from("pre_registered_entries")
      .select("*")
      .order("year")
      .order("month");

    return c.json((data ?? []).map((r) => mapEntry(r as EntryRow)), 200 as const);
  },
);

// ─── POST /budget/pre-registered ──────────────────────────────────────────────

preRegisteredRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/pre-registered",
    tags: ["Pre-registered Entries"],
    summary: "Create a pre-registered entry [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: { required: true, content: { "application/json": { schema: CreatePreRegisteredEntrySchema } } },
    },
    responses: {
      201: {
        description: "Created entry",
        content: { "application/json": { schema: PreRegisteredEntrySchema } },
      },
      400: { description: "Validation error", content: { "application/json": { schema: ErrorSchema } } },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("pre_registered_entries")
      .insert(body)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Failed to create entry" }, 400 as const);
    }

    return c.json(mapEntry(data as EntryRow), 201 as const);
  },
);

// ─── PUT /budget/pre-registered/:id ───────────────────────────────────────────

preRegisteredRouter.use("/budget/pre-registered/:id", requireRole("admin"));

preRegisteredRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/pre-registered/{id}",
    tags: ["Pre-registered Entries"],
    summary: "Update a pre-registered entry [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: IdParamSchema,
      body: { required: true, content: { "application/json": { schema: UpdatePreRegisteredEntrySchema } } },
    },
    responses: {
      200: {
        description: "Updated entry",
        content: { "application/json": { schema: PreRegisteredEntrySchema } },
      },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const { data, error } = await supabase
      .from("pre_registered_entries")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: "Entry not found" }, 404 as const);
    }

    return c.json(mapEntry(data as EntryRow), 200 as const);
  },
);

// ─── DELETE /budget/pre-registered/:id ────────────────────────────────────────

preRegisteredRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/pre-registered/{id}",
    tags: ["Pre-registered Entries"],
    summary: "Delete a pre-registered entry [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
      404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const { error, count } = await supabase
      .from("pre_registered_entries")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error || count === 0) {
      return c.json({ error: "Entry not found" }, 404 as const);
    }

    return new Response(null, { status: 204 });
  },
);
