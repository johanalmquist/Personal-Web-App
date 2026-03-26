import { IconCheck, IconPlus, IconX } from "@tabler/icons-react";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useCreateMasterItem } from "../../hooks/use-master-budget";

interface AddItemRowProps {
  categoryId: string;
  nextSortOrder: number;
  onAdded: () => void;
}

export function AddItemRow({
  categoryId,
  nextSortOrder,
  onAdded,
}: AddItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("0");
  const nameRef = useRef<HTMLInputElement>(null);

  const createItem = useCreateMasterItem({ onSuccess: onAdded });

  useEffect(() => {
    if (isExpanded) {
      nameRef.current?.focus();
    }
  }, [isExpanded]);

  const handleSave = () => {
    const parsed = Number.parseFloat(amount);
    if (name.trim() && !Number.isNaN(parsed) && parsed >= 0) {
      createItem.mutate({
        category_id: categoryId,
        name: name.trim(),
        default_amount: parsed,
        sort_order: nextSortOrder,
      });
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setName("");
    setAmount("0");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--accent-soft)";
          e.currentTarget.style.background = "var(--accent-bg)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-3)";
          e.currentTarget.style.background = "none";
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 16px 9px 38px",
          color: "var(--text-3)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          background: "none",
          border: "none",
          borderTop: "1px solid var(--border-sub)",
          textAlign: "left",
          transition: "color 0.12s, background 0.12s",
        }}
        type="button"
      >
        <IconPlus size={12} />
        Add item
      </button>
    );
  }

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
        borderTop: "1px solid var(--border-sub)",
        padding: "6px 16px 6px 12px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "16px 1fr 88px 68px",
          alignItems: "center",
        }}
      >
        <div />
        <div style={{ paddingLeft: 4, paddingRight: 8 }}>
          <input
            disabled={createItem.isPending}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Item name"
            ref={nameRef}
            style={inputStyle}
            value={name}
          />
        </div>
        <input
          disabled={createItem.isPending}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          style={{ ...inputStyle, textAlign: "right" }}
          value={amount}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
          }}
        >
          <button
            disabled={createItem.isPending}
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
            disabled={createItem.isPending}
            onClick={handleCancel}
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
