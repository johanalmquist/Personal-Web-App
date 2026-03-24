import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { supabase } from "../lib/supabase";
import type { AppVariables } from "../middleware/auth";

// ─── Public auth router (no auth middleware) ──────────────────────────────────

export const publicAuthRouter = new OpenAPIHono();

const TokenRequestSchema = z
  .object({
    grant_type: z.literal("password").openapi({ example: "password" }),
    username: z.string().email().openapi({ example: "user@example.com" }),
    password: z.string().min(1).openapi({ example: "secret" }),
  })
  .openapi("TokenRequest");

const TokenResponseSchema = z
  .object({
    access_token: z.string().openapi({ example: "eyJ..." }),
    token_type: z.literal("bearer").openapi({ example: "bearer" }),
    expires_in: z.number().int().openapi({ example: 3600 }),
  })
  .openapi("TokenResponse");

const TokenErrorSchema = z
  .object({ error: z.string().openapi({ example: "invalid_grant" }) })
  .openapi("TokenError");

publicAuthRouter.openapi(
  createRoute({
    method: "post",
    path: "/auth/token",
    tags: ["Auth"],
    summary: "OAuth2 password grant — exchange email/password for a JWT",
    request: {
      body: {
        required: true,
        content: {
          "application/x-www-form-urlencoded": { schema: TokenRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "JWT access token",
        content: { "application/json": { schema: TokenResponseSchema } },
      },
      401: {
        description: "Invalid credentials",
        content: { "application/json": { schema: TokenErrorSchema } },
      },
    },
  }),
  async (c) => {
    const body = await c.req.parseBody();
    const email = body.username as string;
    const password = body.password as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error ?? !data.session) {
      return c.json({ error: "invalid_grant" }, 401 as const);
    }

    return c.json(
      {
        access_token: data.session.access_token,
        token_type: "bearer" as const,
        expires_in: data.session.expires_in,
      },
      200 as const,
    );
  },
);

// ─── Protected auth router (behind auth middleware) ───────────────────────────

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
    security: [{ BearerAuth: [] }],
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
