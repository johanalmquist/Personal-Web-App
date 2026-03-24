import { Hono } from "hono";
import { env } from "./env";
import { supabase } from "./lib/supabase";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello from the API!", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/health/db", async (c) => {
  const { error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (error) {
    return c.json({ status: "unhealthy", error: error.message }, 503);
  }
  return c.json({ status: "healthy" });
});

export default {
  port: env.PORT,
  fetch: app.fetch,
};
