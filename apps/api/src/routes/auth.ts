import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../lib/supabase";
import type { AppVariables } from "../middleware/auth";

export const authRouter = new OpenAPIHono<{ Variables: AppVariables }>();

const MeResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    email: z.string().email().openapi({ example: "user@example.com" }),
    role: z.enum(["admin", "viewer"]).openapi({ example: "viewer" }),
  })
  .openapi("MeResponse");


authRouter.openapi(
  createRoute({
    method: "get",
    path: "/auth/me",
    tags: ["Auth"],
    summary: "Get current user profile",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Authenticated user's id, email and role",
        content: { "application/json": { schema: MeResponseSchema } },
      },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const role = c.get("role");

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);

    return c.json({
      id: userId,
      email: user?.email ?? "",
      role,
    });
  },
);
