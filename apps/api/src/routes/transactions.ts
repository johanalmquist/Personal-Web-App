import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  AttachmentResponseSchema,
  CreateTransactionSchema,
  TransactionSchema,
  TransactionWithBalanceSchema,
  UpdateTransactionSchema,
} from "@personal/types";
import {
  deleteReceipt,
  getReceiptSignedUrl,
  uploadReceipt,
} from "../lib/storage";
import { supabase } from "../lib/supabase";
import { type AppVariables, requireRole } from "../middleware/auth";

export const transactionsRouter = new OpenAPIHono<{
  Variables: AppVariables;
}>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("TransactionError");
const BudgetParamSchema = z.object({ id: z.string().uuid() });
const TxParamSchema = z.object({
  id: z.string().uuid(),
  txId: z.string().uuid(),
});

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Helper ────────────────────────────────────────────────────────────────────

interface TxRow {
  amount: unknown;
  attachment_path: string | null;
  created_at: string;
  date: string;
  description: string;
  id: string;
  monthly_budget_id: string;
  monthly_item_id: string | null;
  transaction_tags: { tag_id: string }[];
  type: "income" | "expense";
  updated_at: string;
}

function mapTx(row: TxRow) {
  const { transaction_tags, amount, ...rest } = row;
  return {
    ...rest,
    amount: Number(amount),
    tags: transaction_tags.map((t) => t.tag_id),
  };
}

// ─── GET /budget/monthly/:id/transactions ─────────────────────────────────────

const TransactionFiltersSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  tag: z.string().uuid().optional(),
});

transactionsRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/monthly/{id}/transactions",
    tags: ["Transactions"],
    summary: "List transactions for a monthly budget with running balance",
    security: [{ BearerAuth: [] }],
    request: {
      params: BudgetParamSchema,
      query: TransactionFiltersSchema,
    },
    responses: {
      200: {
        description: "Transactions with running balance",
        content: {
          "application/json": { schema: z.array(TransactionWithBalanceSchema) },
        },
      },
      404: {
        description: "Monthly budget not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { date_from, date_to, type, tag } = c.req.valid("query");

    // Fetch budget overview data and transactions in parallel
    let txQuery = supabase
      .from("transactions")
      .select("*, transaction_tags(tag_id)")
      .eq("monthly_budget_id", id)
      .order("date", { ascending: true });

    if (date_from) {
      txQuery = txQuery.gte("date", date_from);
    }
    if (date_to) {
      txQuery = txQuery.lte("date", date_to);
    }
    if (type) {
      txQuery = txQuery.eq("type", type);
    }

    const [budgetResult, budgetItemsResult, txResult] = await Promise.all([
      supabase.from("monthly_budgets").select("income").eq("id", id).single(),
      supabase
        .from("monthly_budget_items")
        .select("budgeted_amount")
        .eq("monthly_budget_id", id),
      txQuery,
    ]);

    if (budgetResult.error || !budgetResult.data) {
      return c.json({ error: "Monthly budget not found" }, 404 as const);
    }

    const income = Number(budgetResult.data.income);
    const total_budgeted = (budgetItemsResult.data ?? []).reduce(
      (sum, i) => sum + Number(i.budgeted_amount),
      0
    );
    const variable_room = income - total_budgeted;

    let transactions = (txResult.data ?? []) as TxRow[];

    // Post-filter by tag (client-side)
    if (tag) {
      transactions = transactions.filter((tx) =>
        tx.transaction_tags.some((t) => t.tag_id === tag)
      );
    }

    let cumulative = 0;
    const result = transactions.map((tx) => {
      if (tx.type === "expense") {
        cumulative += Number(tx.amount);
      }
      return { ...mapTx(tx), running_balance: variable_room - cumulative };
    });

    return c.json(result, 200 as const);
  }
);

// ─── POST /budget/monthly/:id/transactions ────────────────────────────────────

transactionsRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/monthly/{id}/transactions",
    tags: ["Transactions"],
    summary: "Create a transaction [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: BudgetParamSchema,
      body: {
        required: true,
        content: { "application/json": { schema: CreateTransactionSchema } },
      },
    },
    responses: {
      201: {
        description: "Created transaction",
        content: { "application/json": { schema: TransactionSchema } },
      },
      403: {
        description: "Forbidden",
        content: { "application/json": { schema: ErrorSchema } },
      },
      400: {
        description: "Validation error",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { id } = c.req.valid("param");
    const { tags, ...txFields } = c.req.valid("json");

    const { data: tx, error } = await supabase
      .from("transactions")
      .insert({ ...txFields, monthly_budget_id: id })
      .select()
      .single();

    if (error || !tx) {
      return c.json({ error: "Failed to create transaction" }, 400 as const);
    }

    if (tags && tags.length > 0) {
      await supabase
        .from("transaction_tags")
        .insert(tags.map((tag_id) => ({ transaction_id: tx.id, tag_id })));
    }

    const { data: full } = await supabase
      .from("transactions")
      .select("*, transaction_tags(tag_id)")
      .eq("id", tx.id)
      .single();

    return c.json(mapTx(full as TxRow), 201 as const);
  }
);

// ─── PUT /budget/monthly/:id/transactions/:txId ───────────────────────────────

transactionsRouter.openapi(
  createRoute({
    method: "put",
    path: "/budget/monthly/{id}/transactions/{txId}",
    tags: ["Transactions"],
    summary: "Update a transaction [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: TxParamSchema,
      body: {
        required: true,
        content: { "application/json": { schema: UpdateTransactionSchema } },
      },
    },
    responses: {
      200: {
        description: "Updated transaction",
        content: { "application/json": { schema: TransactionSchema } },
      },
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
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { id, txId } = c.req.valid("param");
    const { tags, ...txFields } = c.req.valid("json");

    const { data: tx, error } = await supabase
      .from("transactions")
      .update(txFields)
      .eq("id", txId)
      .eq("monthly_budget_id", id)
      .select()
      .single();

    if (error || !tx) {
      return c.json({ error: "Transaction not found" }, 404 as const);
    }

    // Replace tags if provided (even if empty array — means "clear tags")
    if (tags !== undefined) {
      await supabase
        .from("transaction_tags")
        .delete()
        .eq("transaction_id", txId);
      if (tags.length > 0) {
        await supabase
          .from("transaction_tags")
          .insert(tags.map((tag_id) => ({ transaction_id: txId, tag_id })));
      }
    }

    const { data: full } = await supabase
      .from("transactions")
      .select("*, transaction_tags(tag_id)")
      .eq("id", txId)
      .single();

    return c.json(mapTx(full as TxRow), 200 as const);
  }
);

// ─── DELETE /budget/monthly/:id/transactions/:txId ────────────────────────────

transactionsRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/monthly/{id}/transactions/{txId}",
    tags: ["Transactions"],
    summary: "Delete a transaction (and its receipt if any) [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: TxParamSchema },
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
    if (c.get("role") !== "admin") {
      return c.json({ error: "Forbidden" }, 403 as const);
    }

    const { id, txId } = c.req.valid("param");

    // Fetch transaction to check ownership and get attachment path
    const { data: tx } = await supabase
      .from("transactions")
      .select("attachment_path")
      .eq("id", txId)
      .eq("monthly_budget_id", id)
      .single();

    if (!tx) {
      return c.json({ error: "Transaction not found" }, 404 as const);
    }

    // Remove storage receipt if present (non-fatal)
    if (tx.attachment_path) {
      await deleteReceipt(tx.attachment_path);
    }

    const { error, count } = await supabase
      .from("transactions")
      .delete({ count: "exact" })
      .eq("id", txId)
      .eq("monthly_budget_id", id);

    if (error || count === 0) {
      return c.json({ error: "Transaction not found" }, 404 as const);
    }

    return new Response(null, { status: 204 });
  }
);

// ─── Attachment endpoints (admin-only paths) ───────────────────────────────────

transactionsRouter.use(
  "/budget/monthly/:id/transactions/:txId/attachment",
  requireRole("admin")
);

// ─── POST /budget/monthly/:id/transactions/:txId/attachment ───────────────────

transactionsRouter.openapi(
  createRoute({
    method: "post",
    path: "/budget/monthly/{id}/transactions/{txId}/attachment",
    tags: ["Transactions"],
    summary: "Upload a receipt image for a transaction [admin only]",
    security: [{ BearerAuth: [] }],
    request: {
      params: TxParamSchema,
      body: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: z.object({ file: z.any() }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Uploaded receipt",
        content: { "application/json": { schema: AttachmentResponseSchema } },
      },
      400: {
        description: "Upload failed",
        content: { "application/json": { schema: ErrorSchema } },
      },
      404: {
        description: "Transaction not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
      413: {
        description: "File too large",
        content: { "application/json": { schema: ErrorSchema } },
      },
      422: {
        description: "Invalid file type",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id, txId } = c.req.valid("param");

    const body = await c.req.parseBody();
    const file = body.file;

    if (!(file instanceof File)) {
      return c.json({ error: "Missing file field" }, 400 as const);
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return c.json(
        { error: "Invalid file type. Allowed: jpeg, png, webp, heic" },
        422 as const
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: "File exceeds 10 MB limit" }, 413 as const);
    }

    // Verify transaction exists and belongs to the budget
    const { data: tx } = await supabase
      .from("transactions")
      .select("attachment_path")
      .eq("id", txId)
      .eq("monthly_budget_id", id)
      .single();

    if (!tx) {
      return c.json({ error: "Transaction not found" }, 404 as const);
    }

    // Replace existing receipt if present
    if (tx.attachment_path) {
      await deleteReceipt(tx.attachment_path);
    }

    const bytes = await file.arrayBuffer();
    const path = await uploadReceipt(txId, file.name, bytes, file.type);

    if (!path) {
      return c.json({ error: "Failed to upload receipt" }, 400 as const);
    }

    await supabase
      .from("transactions")
      .update({ attachment_path: path })
      .eq("id", txId);

    const signed_url = (await getReceiptSignedUrl(path)) ?? "";

    return c.json({ attachment_path: path, signed_url }, 200 as const);
  }
);

// ─── DELETE /budget/monthly/:id/transactions/:txId/attachment ─────────────────

transactionsRouter.openapi(
  createRoute({
    method: "delete",
    path: "/budget/monthly/{id}/transactions/{txId}/attachment",
    tags: ["Transactions"],
    summary: "Remove receipt image from a transaction [admin only]",
    security: [{ BearerAuth: [] }],
    request: { params: TxParamSchema },
    responses: {
      204: { description: "Deleted" },
      404: {
        description: "Not found",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { id, txId } = c.req.valid("param");

    const { data: tx } = await supabase
      .from("transactions")
      .select("attachment_path")
      .eq("id", txId)
      .eq("monthly_budget_id", id)
      .single();

    if (!tx) {
      return c.json({ error: "Transaction not found" }, 404 as const);
    }

    if (!tx.attachment_path) {
      return c.json(
        { error: "No attachment on this transaction" },
        404 as const
      );
    }

    await deleteReceipt(tx.attachment_path);

    await supabase
      .from("transactions")
      .update({ attachment_path: null })
      .eq("id", txId);

    return new Response(null, { status: 204 });
  }
);
