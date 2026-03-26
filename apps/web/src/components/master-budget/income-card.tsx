import { IconCheck, IconTrendingUp, IconX } from "@tabler/icons-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useUpdateMasterSettings } from "../../hooks/use-master-budget";
import { formatCurrency, formatNegativeCurrency } from "../../lib/format";

interface IncomeCardProps {
  isAdmin: boolean;
  monthlyIncome: number;
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
}: IncomeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(String(monthlyIncome));
  const inputRef = useRef<HTMLInputElement>(null);
  const updateSettings = useUpdateMasterSettings({
    onSuccess: () => setIsEditing(false),
  });

  useEffect(() => {
    if (isEditing) {
      setValue(String(monthlyIncome));
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, monthlyIncome]);

  const handleSave = () => {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateSettings.mutate({ monthly_income: parsed });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(String(monthlyIncome));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

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
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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

          {isEditing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                disabled={updateSettings.isPending}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                style={{
                  background: "var(--surface-raised)",
                  border: "1.5px solid var(--accent)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--green)",
                  padding: "3px 8px",
                  outline: "none",
                  width: 140,
                  fontVariantNumeric: "tabular-nums",
                }}
                value={value}
              />
              <button
                disabled={updateSettings.isPending}
                onClick={handleSave}
                style={{
                  background: "var(--green-bg)",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  padding: "4px 6px",
                  cursor: "pointer",
                  color: "var(--green)",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Save"
                type="button"
              >
                <IconCheck size={14} />
              </button>
              <button
                disabled={updateSettings.isPending}
                onClick={handleCancel}
                style={{
                  background: "var(--red-bg)",
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  padding: "4px 6px",
                  cursor: "pointer",
                  color: "var(--red)",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Cancel"
                type="button"
              >
                <IconX size={14} />
              </button>
            </div>
          ) : (
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
          )}
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
      {isAdmin && !isEditing && (
        <>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setIsEditing(true)}
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
