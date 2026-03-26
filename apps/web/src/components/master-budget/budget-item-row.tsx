import type { MasterBudgetItem } from "@personal/types";
import { IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import type { DragEvent } from "react";
import { useState } from "react";
import { formatCurrency } from "../../lib/format";

interface BudgetItemRowProps {
  isAdmin: boolean;
  isDragOver: boolean;
  isLast: boolean;
  item: MasterBudgetItem;
  onDelete: () => void;
  onDragOver: (e: DragEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onEdit: () => void;
}

export function BudgetItemRow({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
  isLast,
}: BudgetItemRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: draggable row
    // biome-ignore lint/a11y/noStaticElementInteractions: draggable row
    <div
      draggable={isAdmin}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "16px 1fr 88px 68px",
        alignItems: "center",
        minHeight: 42,
        padding: "0 16px 0 12px",
        borderBottom: isLast ? "none" : "1px solid var(--border-sub)",
        borderTop: isDragOver
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        cursor: isAdmin ? "grab" : "default",
        transition: "border-color 0.1s",
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          opacity: isAdmin ? 0.25 : 0,
        }}
      >
        <IconGripVertical color="var(--text-3)" size={12} />
      </div>

      {/* Name */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text)",
          paddingLeft: 4,
        }}
      >
        {item.name}
      </span>

      {/* Amount */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatCurrency(item.default_amount)}
      </span>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
          opacity: isAdmin && hovered ? 1 : 0,
          transition: "opacity 0.12s",
        }}
      >
        <ActionButton
          icon={<IconPencil size={14} />}
          onClick={onEdit}
          title="Edit item"
        />
        <ActionButton
          danger
          icon={<IconTrash size={14} />}
          onClick={onDelete}
          title="Delete item"
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  title,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: "none",
        border: "none",
        padding: "3px 4px",
        cursor: "pointer",
        color: danger ? "var(--red)" : "var(--text-3)",
        borderRadius: "var(--r-sm)",
        display: "flex",
        alignItems: "center",
      }}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
}
