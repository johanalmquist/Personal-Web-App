import { Hono } from "hono";
import { env } from "./env";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello from the API!", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default {
  port: env.PORT,
  fetch: app.fetch,
};
