import type { MiddlewareHandler } from "hono";
import { supabase } from "../lib/supabase";

export interface AppVariables {
  role: "admin" | "viewer";
  userId: string;
}

export const authMiddleware: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", user.id);
  c.set("role", profile.role as "admin" | "viewer");

  return next();
};

export const requireRole =
  (role: "admin" | "viewer"): MiddlewareHandler<{ Variables: AppVariables }> =>
  async (c, next) => {
    if (c.get("role") !== role) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
    return;
  };
