import type { MasterBudgetItem } from "@personal/types";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface BudgetItemRowEditingProps {
  isSaving: boolean;
  item: MasterBudgetItem;
  onCancel: () => void;
  onSave: (name: string, amount: number) => void;
}

export function BudgetItemRowEditing({
  item,
  onSave,
  onCancel,
  isSaving,
}: BudgetItemRowEditingProps) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.default_amount));
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  const handleSave = () => {
    const parsed = Number.parseFloat(amount);
    if (name.trim() && !Number.isNaN(parsed) && parsed >= 0) {
      onSave(name.trim(), parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const inputStyle = {
    background: "var(--surface-raised)",
    border: "1.5px solid var(--accent)",
    borderRadius: "var(--r-sm)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    padding: "5px 8px",
    outline: "none",
    width: "100%",
  } as const;

  return (
    <div
      style={{
        background: "rgba(66,99,235,.05)",
        borderBottom: "1px solid var(--border-sub)",
        padding: "6px 16px 6px 12px",
      }}
    >
      {/* Input row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "16px 1fr 88px 68px",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* Spacer for drag handle column */}
        <div />

        {/* Name input */}
        <div style={{ paddingLeft: 4, paddingRight: 8 }}>
          <input
            disabled={isSaving}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Item name"
            ref={nameRef}
            style={inputStyle}
            value={name}
          />
        </div>

        {/* Amount input */}
        <input
          disabled={isSaving}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          style={{ ...inputStyle, textAlign: "right" }}
          value={amount}
        />

        {/* Save / Cancel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
          }}
        >
          <button
            disabled={isSaving}
            onClick={handleSave}
            style={{
              background: "var(--green-bg)",
              border: "none",
              borderRadius: "var(--r-sm)",
              padding: "3px 5px",
              cursor: "pointer",
              color: "var(--green)",
              display: "flex",
              alignItems: "center",
            }}
            title="Save"
            type="button"
          >
            <IconCheck size={13} />
          </button>
          <button
            disabled={isSaving}
            onClick={onCancel}
            style={{
              background: "var(--red-bg)",
              border: "none",
              borderRadius: "var(--r-sm)",
              padding: "3px 5px",
              cursor: "pointer",
              color: "var(--red)",
              display: "flex",
              alignItems: "center",
            }}
            title="Cancel"
            type="button"
          >
            <IconX size={13} />
          </button>
        </div>
      </div>

      {/* Hint */}
      <div
        style={{
          fontSize: 9,
          color: "var(--accent-soft)",
          opacity: 0.7,
          paddingLeft: 20,
          marginTop: 3,
        }}
      >
        ↵ save · Esc cancel
      </div>
    </div>
  );
}
