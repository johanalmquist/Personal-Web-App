import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { CreateTagSchema, TagSchema } from "@personal/types";
import { supabase } from "../lib/supabase";
import { type AppVariables, requireRole } from "../middleware/auth";

export const tagsRouter = new OpenAPIHono<{ Variables: AppVariables }>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("TagError");
const IdParamSchema = z.object({ id: z.string().uuid() });

// ─── GET /budget/tags ──────────────────────────────────────────────────────────

tagsRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/tags",
    tags: ["Tags"],
    summary: "List all tags",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "List of tags",
        content: { "application/json": { schema: z.array(TagSchema) } },
      },
    },
  }),
  async (c) => {
    const { data } = await supabase.from("tags").select("*").order("name");
    return c.json(data ?? [], 200 as const);
  }
);

// ─── POST /budget/tags ─────────────────────────────────────────────────────────

tagsRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/tags",
    tags: ["Tags"],
    summary: "Create a tag [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: { "application/json": { schema: CreateTagSchema } },
      },
    },
    responses: {
      201: {
        description: "Created tag",
        content: { "application/json": { schema: TagSchema } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      409: {
        description: "Tag name already exists",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { name } = c.req.valid("json");

    const { data, error } = await supabase
      .from("tags")
      .insert({ name })
      .select()
      .single();

    if (error || !data) {
      const isUnique = error?.code === "23505";
      if (isUnique) {
        return c.json({ error: "Tag name already exists" }, 409 as const);
      }
      return c.json({ error: "Failed to create tag" }, 409 as const);
    }

    return c.json(data, 201 as const);
  }
);

// ─── DELETE /budget/tags/:id ───────────────────────────────────────────────────

tagsRouter.use("/budget/tags/:id", requireRole("admin"));

tagsRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/tags/{id}",
    tags: ["Tags"],
    summary: "Delete a tag [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
      204: { description: "Deleted" },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const { error, count } = await supabase
      .from("tags")
      .delete({ count: "exact" })
      .eq("id", id);

    if (error || count === 0) {
      return c.json({ error: "Tag not found" }, 404 as const);
    }

    return new Response(null, { status: 204 });
  }
);
