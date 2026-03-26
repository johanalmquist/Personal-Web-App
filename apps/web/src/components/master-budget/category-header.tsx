import type { BudgetCategory } from "@personal/types";
import {
  IconChevronRight,
  IconGripVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import type { DragEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../lib/format";

interface CategoryHeaderProps {
  category: BudgetCategory;
  editName: string;
  isAdmin: boolean;
  isDragOver: boolean;
  isEditing: boolean;
  isOpen: boolean;
  itemCount: number;
  onDelete: () => void;
  onDragOver: (e: DragEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onEdit: () => void;
  onEditCancel: () => void;
  onEditNameChange: (name: string) => void;
  onEditSave: () => void;
  onToggle: () => void;
  total: number;
}

export function CategoryHeader({
  category,
  total,
  itemCount,
  isOpen,
  isAdmin,
  isEditing,
  editName,
  onEditNameChange,
  onToggle,
  onEdit,
  onEditSave,
  onEditCancel,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: CategoryHeaderProps) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onEditSave();
    }
    if (e.key === "Escape") {
      onEditCancel();
    }
  };

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: draggable row
    // biome-ignore lint/a11y/noStaticElementInteractions: draggable row
    <div
      draggable={isAdmin && !isEditing}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "20px 20px 1fr 88px 68px",
        alignItems: "center",
        height: 42,
        background: "var(--surface-raised)",
        padding: "0 16px 0 12px",
        cursor: isAdmin && !isEditing ? "grab" : "default",
        borderTop: isDragOver
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        transition: "border-color 0.1s",
      }}
    >
      {/* Drag handle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          opacity: isAdmin ? 0.35 : 0,
        }}
      >
        <IconGripVertical color="var(--text-3)" size={14} />
      </div>

      {/* Chevron toggle */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "var(--text-3)",
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.15s",
        }}
        type="button"
      >
        <IconChevronRight size={11} />
      </button>

      {/* Name + count badge */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
      >
        {isEditing ? (
          <input
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            style={{
              background: "var(--surface-raised)",
              border: "1.5px solid var(--accent)",
              borderRadius: "var(--r-sm)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              padding: "4px 8px",
              outline: "none",
              width: "100%",
              maxWidth: 200,
            }}
            value={editName}
          />
        ) : (
          <>
            <span
              style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}
            >
              {category.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "var(--border)",
                color: "var(--text-3)",
                padding: "1px 6px",
                borderRadius: "var(--r-pill)",
              }}
            >
              {itemCount}
            </span>
          </>
        )}
      </div>

      {/* Total */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-2)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatCurrency(total)}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
          opacity: isAdmin && hovered && !isEditing ? 1 : 0,
          transition: "opacity 0.12s",
        }}
      >
        <IconButton
          icon={<IconPencil size={14} />}
          onClick={onEdit}
          title="Edit category"
        />
        <IconButton
          danger
          icon={<IconTrash size={14} />}
          onClick={onDelete}
          title="Delete category"
        />
      </div>
    </div>
  );
}

function IconButton({
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
