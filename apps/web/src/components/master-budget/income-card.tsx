import { IconTrendingUp } from "@tabler/icons-react";
import { formatCurrency, formatNegativeCurrency } from "../../lib/format";

interface IncomeCardProps {
  isAdmin: boolean;
  monthlyIncome: number;
  onEditIncome: () => void;
  totalFixed: number;
  variableRoom: number;
}

const divider = (
  <div
    style={{
      width: 1,
      height: 32,
      background: "var(--border)",
      flexShrink: 0,
    }}
  />
);

export function IncomeCard({
  monthlyIncome,
  totalFixed,
  variableRoom,
  isAdmin,
  onEditIncome,
}: IncomeCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        padding: "18px 22px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      {/* Left: icon + label + value */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            background: "var(--green-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconTrendingUp color="var(--green)" size={20} stroke={2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Monthly net income
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--green)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {formatCurrency(monthlyIncome)}
          </span>
        </div>
      </div>

      {divider}

      {/* Fixed costs */}
      <StatBlock
        label="Fixed costs"
        value={formatNegativeCurrency(totalFixed)}
        valueColor="var(--red)"
      />

      {divider}

      {/* Variable room */}
      <StatBlock
        label="Variable room"
        value={formatCurrency(variableRoom)}
        valueColor="var(--accent-soft)"
      />

      {/* Edit income — admin only */}
      {isAdmin && (
        <>
          <div style={{ flex: 1 }} />
          <button
            onClick={onEditIncome}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              color: "var(--text-2)",
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 11px",
              cursor: "pointer",
            }}
            type="button"
          >
            Edit income
          </button>
        </>
      )}
    </div>
  );
}

function StatBlock({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: valueColor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}
