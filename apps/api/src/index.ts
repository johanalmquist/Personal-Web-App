import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { env } from "./env";
import { type AppVariables, authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";

const app = new OpenAPIHono();

// ─── Public routes ────────────────────────────────────────────────────────────

app.route("/", healthRouter);

// ─── OpenAPI spec + Scalar docs ───────────────────────────────────────────────

app.doc("/api/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Personal Finance API",
    version: "1.0.0",
    description: "Backend API for the personal finance web app.",
  },
  servers: [{ url: "/", description: "Current server" }],
});

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

app.get(
  "/docs",
  apiReference({
    url: "/api/openapi.json",
    pageTitle: "Personal Finance API Docs",
  }),
);

// ─── Protected /api/v1 routes ─────────────────────────────────────────────────

const v1 = new OpenAPIHono<{ Variables: AppVariables }>();
v1.use("*", authMiddleware);
v1.route("/", authRouter);

app.route("/api/v1", v1);

// ─── Server ───────────────────────────────────────────────────────────────────

export default {
  port: env.PORT,
  fetch: app.fetch,
};
