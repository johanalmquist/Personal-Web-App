import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import ExcelJS from "exceljs";
import { supabase } from "../lib/supabase";
import type { AppVariables } from "../middleware/auth";

export const exportRouter = new OpenAPIHono<{ Variables: AppVariables }>();

// ─── Shared schemas ────────────────────────────────────────────────────────────

const ErrorSchema = z.object({ error: z.string() }).openapi("ExportError");

const ExportQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM"),
  to: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM"),
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface ParsedYM {
  month: number;
  year: number;
}

function parseYM(s: string): ParsedYM {
  const parts = s.split("-").map(Number);
  return { year: parts[0] as number, month: parts[1] as number };
}

function monthsInRange(from: string, to: string): ParsedYM[] {
  const start = parseYM(from);
  const end = parseYM(to);
  const result: ParsedYM[] = [];
  let { year: y, month: m } = start;
  while (y < end.year || (y === end.year && m <= end.month)) {
    result.push({ year: y, month: m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return result;
}

function isFromAfterTo(from: string, to: string): boolean {
  const f = parseYM(from);
  const t = parseYM(to);
  return f.year > t.year || (f.year === t.year && f.month > t.month);
}

interface TxRow {
  amount: unknown;
  created_at: string;
  date: string;
  description: string;
  id: string;
  monthly_budget_id: string;
  monthly_item_id: string | null;
  transaction_tags: { tags: { name: string } | null }[];
  type: "income" | "expense";
}

function getTxTagNames(tx: TxRow): string {
  return tx.transaction_tags
    .map((tt) => tt.tags?.name ?? "")
    .filter(Boolean)
    .join(", ");
}

// ─── Sheet builder ─────────────────────────────────────────────────────────────

interface BudgetItem {
  budgeted_amount: unknown;
  category_name: string;
  id: string;
  item_name: string;
}

interface MonthlyBudget {
  id: string;
  income: unknown;
  month: number;
  status: string;
  year: number;
}

function buildMonthSheet(
  ws: ExcelJS.Worksheet,
  year: number,
  month: number,
  budget: MonthlyBudget,
  items: BudgetItem[],
  txs: TxRow[]
): void {
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  // ── Title ──
  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `Budget ${monthLabel}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };

  // ── Overview ──
  const income = Number(budget.income);
  const totalBudgeted = items.reduce(
    (s, i) => s + Number(i.budgeted_amount),
    0
  );
  const variableRoom = income - totalBudgeted;
  const totalExpenses = txs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const actualRemaining = variableRoom - totalExpenses;

  let row = 3;
  ws.getCell(`A${row}`).value = "OVERVIEW";
  ws.getCell(`A${row}`).font = { bold: true };
  row++;

  const overviewRows: [string, number][] = [
    ["Income", income],
    ["Total Budgeted", totalBudgeted],
    ["Variable Room", variableRoom],
    ["Total Expenses", totalExpenses],
    ["Actual Remaining", actualRemaining],
  ];
  for (const [label, value] of overviewRows) {
    ws.getCell(`A${row}`).value = label;
    ws.getCell(`B${row}`).value = value;
    ws.getCell(`B${row}`).numFmt = "#,##0.00";
    row++;
  }

  // ── Category Summary ──
  row++;
  ws.getCell(`A${row}`).value = "CATEGORY SUMMARY";
  ws.getCell(`A${row}`).font = { bold: true };
  row++;

  const summaryHeaders = [
    "Category",
    "Item",
    "Budgeted",
    "Actual",
    "Difference",
  ];
  summaryHeaders.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  row++;

  for (const item of items) {
    const actual = txs
      .filter((t) => t.monthly_item_id === item.id && t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const budgeted = Number(item.budgeted_amount);
    ws.getCell(`A${row}`).value = item.category_name;
    ws.getCell(`B${row}`).value = item.item_name;
    ws.getCell(`C${row}`).value = budgeted;
    ws.getCell(`C${row}`).numFmt = "#,##0.00";
    ws.getCell(`D${row}`).value = actual;
    ws.getCell(`D${row}`).numFmt = "#,##0.00";
    ws.getCell(`E${row}`).value = budgeted - actual;
    ws.getCell(`E${row}`).numFmt = "#,##0.00";
    row++;
  }

  // ── Transaction Log ──
  row++;
  ws.getCell(`A${row}`).value = "TRANSACTION LOG";
  ws.getCell(`A${row}`).font = { bold: true };
  row++;

  const txHeaders = [
    "Date",
    "Description",
    "Category/Item",
    "Type",
    "Amount",
    "Tags",
    "Running Balance",
  ];
  txHeaders.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.font = { bold: true };
  });
  row++;

  let runningBalance = variableRoom;
  for (const tx of txs) {
    const amount = Number(tx.amount);
    if (tx.type === "expense") {
      runningBalance -= amount;
    } else {
      runningBalance += amount;
    }

    const itemLabel = tx.monthly_item_id
      ? (items.find((i) => i.id === tx.monthly_item_id)?.item_name ?? "")
      : "";

    ws.getCell(`A${row}`).value = tx.date;
    ws.getCell(`B${row}`).value = tx.description;
    ws.getCell(`C${row}`).value = itemLabel;
    ws.getCell(`D${row}`).value = tx.type;
    ws.getCell(`E${row}`).value = amount;
    ws.getCell(`E${row}`).numFmt = "#,##0.00";
    ws.getCell(`F${row}`).value = getTxTagNames(tx);
    ws.getCell(`G${row}`).value = runningBalance;
    ws.getCell(`G${row}`).numFmt = "#,##0.00";
    row++;
  }

  // ── Column widths ──
  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 30;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 10;
  ws.getColumn(5).width = 14;
  ws.getColumn(6).width = 24;
  ws.getColumn(7).width = 18;
}

// ─── GET /budget/export ────────────────────────────────────────────────────────

exportRouter.openapi(
  createRoute({
    method: "get",
    path: "/budget/export",
    tags: ["Export"],
    summary: "Export monthly budgets as Excel workbook",
    security: [{ BearerAuth: [] }],
    request: { query: ExportQuerySchema },
    responses: {
      200: { description: "Excel file (.xlsx) download" },
      400: {
        description: "Invalid date range",
        content: { "application/json": { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { from, to } = c.req.valid("query");

    if (isFromAfterTo(from, to)) {
      return c.json(
        { error: "'from' must be before or equal to 'to'" },
        400 as const
      );
    }

    const months = monthsInRange(from, to);
    if (months.length > 36) {
      return c.json(
        { error: "Date range must not exceed 36 months" },
        400 as const
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Personal Finance API";

    for (const { year, month } of months) {
      const sheetName = `${year}-${String(month).padStart(2, "0")}`;
      const ws = workbook.addWorksheet(sheetName);

      const { data: budget } = await supabase
        .from("monthly_budgets")
        .select("*")
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (!budget) {
        ws.mergeCells("A1:G1");
        const cell = ws.getCell("A1");
        cell.value = `No budget data for ${MONTH_NAMES[month - 1]} ${year}`;
        cell.font = { italic: true };
        continue;
      }

      const [itemsResult, txResult] = await Promise.all([
        supabase
          .from("monthly_budget_items")
          .select("*")
          .eq("monthly_budget_id", budget.id)
          .order("category_name")
          .order("item_name"),
        supabase
          .from("transactions")
          .select("*, transaction_tags(tags(name))")
          .eq("monthly_budget_id", budget.id)
          .order("date")
          .order("created_at"),
      ]);

      buildMonthSheet(
        ws,
        year,
        month,
        budget as MonthlyBudget,
        (itemsResult.data ?? []) as BudgetItem[],
        (txResult.data ?? []) as unknown as TxRow[]
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="budget-export.xlsx"',
      },
    });
  }
);
