import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../lib/supabase";

export const healthRouter = new OpenAPIHono();

const HealthOkSchema = z
  .object({
    status: z.string().openapi({ example: "ok" }),
  })
  .openapi("HealthOk");

const HealthTimestampSchema = z
  .object({
    status: z.string().openapi({ example: "healthy" }),
    timestamp: z.string().openapi({ example: "2026-01-01T00:00:00.000Z" }),
  })
  .openapi("HealthTimestamp");

const HealthErrorSchema = z
  .object({
    status: z.string().openapi({ example: "unhealthy" }),
    error: z.string().openapi({ example: "Connection refused" }),
  })
  .openapi("HealthError");

healthRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Health"],
    summary: "Root",
    responses: {
      200: {
        description: "API is running",
        content: { "application/json": { schema: HealthOkSchema } },
      },
    },
  }),
  (c) => c.json({ status: "ok" }),
);

healthRouter.openapi(
  createRoute({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: "Health check",
    responses: {
      200: {
        description: "Service is healthy",
        content: { "application/json": { schema: HealthTimestampSchema } },
      },
    },
  }),
  (c) => c.json({ status: "healthy", timestamp: new Date().toISOString() }),
);

healthRouter.openapi(
  createRoute({
    method: "get",
    path: "/health/db",
    tags: ["Health"],
    summary: "Database health check",
    responses: {
      200: {
        description: "Database is reachable",
        content: {
          "application/json": {
            schema: z
              .object({ status: z.string() })
              .openapi("DbHealthOk"),
          },
        },
      },
      503: {
        description: "Database is unreachable",
        content: { "application/json": { schema: HealthErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (error) {
      return c.json({ status: "unhealthy", error: error.message }, 503 as const);
    }
    return c.json({ status: "healthy" }, 200 as const);
  },
);
