/**
 * formatCurrency(45000)           → "45\u00A0000 kr"   (non-breaking space as thousands separator)
 * formatNegativeCurrency(450)     → "\u2212 450 kr"     (unicode minus, never hyphen)
 * formatTransactionDate("2025-03-25", 'compact') → "25 Mar"
 * formatTransactionDate("2025-03-25", 'full')    → "25 Mar Wednesday"
 * formatPercentage(86)            → "86%"
 * formatPercentage(115, true)     → "115% ⚠"
 */

function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export function formatCurrency(amount: number): string {
  return `${formatAmount(amount)} kr`;
}

export function formatNegativeCurrency(amount: number): string {
  return `\u2212 ${formatAmount(Math.abs(amount))} kr`;
}

export function formatTransactionDate(
  date: string,
  format: "compact" | "full"
): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);

  if (format === "compact") {
    return `${day} ${month}`;
  }

  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(
    d
  );
  return `${day} ${month} ${weekday}`;
}

export function formatPercentage(value: number, warnOver100 = false): string {
  const rounded = Math.round(value);
  const base = `${rounded}%`;
  return warnOver100 && rounded > 100 ? `${base} \u26A0` : base;
}
