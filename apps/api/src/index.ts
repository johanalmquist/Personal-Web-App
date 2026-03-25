import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { env } from "./env";
import { type AppVariables, authMiddleware } from "./middleware/auth";
import { authRouter, publicAuthRouter } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { masterBudgetRouter } from "./routes/master-budget";
import { monthlyBudgetRouter } from "./routes/monthly-budget";

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

app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
  type: "oauth2",
  flows: { password: { tokenUrl: "/api/v1/auth/token", scopes: {} } },
  description: "Login with Supabase email/password. Use the Authorize button to get a token.",
});

app.get(
  "/docs",
  apiReference({
    url: "/api/openapi.json",
    pageTitle: "Personal Finance API Docs",
    authentication: {
      preferredSecurityScheme: "BearerAuth",
    },
  }),
);

// ─── Public /api/v1 routes (no auth) ─────────────────────────────────────────

app.route("/api/v1", publicAuthRouter);

// ─── Protected /api/v1 routes ─────────────────────────────────────────────────

const v1 = new OpenAPIHono<{ Variables: AppVariables }>();
v1.use("*", authMiddleware);
v1.route("/", authRouter);
v1.route("/", masterBudgetRouter);
v1.route("/", monthlyBudgetRouter);

app.route("/api/v1", v1);

// ─── Server ───────────────────────────────────────────────────────────────────

export default {
  port: env.PORT,
  fetch: app.fetch,
};
