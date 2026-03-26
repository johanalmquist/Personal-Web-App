import { IconPlus } from "@tabler/icons-react";
import type { DragEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { CategoryBlock } from "../components/master-budget/category-block";
import { IncomeCard } from "../components/master-budget/income-card";
import { useAuth } from "../contexts/auth-context";
import { useSetTopbarActions } from "../contexts/topbar-actions-context";
import {
  useCreateCategory,
  useMasterBudget,
  useUpdateCategory,
  useUpdateMasterItem,
} from "../hooks/use-master-budget";
import { formatNegativeCurrency } from "../lib/format";

// ─── Drag state ────────────────────────────────────────────────────────────────

interface DragState {
  categoryId?: string;
  id: string;
  type: "category" | "item";
}

function betweenSortOrders(prev?: number, next?: number): number {
  if (prev != null && next != null) {
    return (prev + next) / 2;
  }
  if (prev != null) {
    return prev + 1000;
  }
  if (next != null) {
    return next - 1000;
  }
  return 0;
}

// ─── Shared button styles ──────────────────────────────────────────────────────

const ghostButtonStyle = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  color: "var(--text-2)",
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
} as const;

const primaryButtonStyle = {
  background: "var(--accent)",
  border: "none",
  borderRadius: "var(--r-sm)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  padding: "6px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
} as const;

// ─── Page ──────────────────────────────────────────────────────────────────────

export function MasterBudgetPage() {
  const { data, isLoading } = useMasterBudget();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const dragItemRef = useRef<DragState | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(
    null
  );
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const updateCategory = useUpdateCategory();
  const updateItem = useUpdateMasterItem();
  const createCategory = useCreateCategory({
    onSuccess: () => setIsAddingCategory(false),
  });

  const categories = useMemo(
    () =>
      [...(data?.categories ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [data?.categories]
  );

  const totalFixed = useMemo(
    () =>
      categories
        .flatMap((c) => c.items)
        .reduce((s, i) => s + i.default_amount, 0),
    [categories]
  );

  const variableRoom = (data?.settings.monthly_income ?? 0) - totalFixed;

  const nextCategorySortOrder =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.sort_order)) + 1000
      : 1000;

  // ─── Topbar actions ───────────────────────────────────────────────────────────

  const topbarActions = useMemo(
    () => (
      <>
        <span
          style={{
            background: "var(--accent-bg)",
            color: "var(--accent-soft)",
            borderRadius: "var(--r-pill)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            letterSpacing: "0.02em",
          }}
        >
          Template
        </span>
        <button style={ghostButtonStyle} type="button">
          Export .xlsx
        </button>
        {isAdmin && (
          <button
            onClick={() => setIsAddingCategory(true)}
            style={primaryButtonStyle}
            type="button"
          >
            <IconPlus size={14} />
            Add Category
          </button>
        )}
      </>
    ),
    [isAdmin]
  );

  useSetTopbarActions(topbarActions, [topbarActions]);

  // ─── Drag handlers — categories ──────────────────────────────────────────────

  const handleDragStartCategory = (e: DragEvent, id: string) => {
    dragItemRef.current = { type: "category", id };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverCategory = (e: DragEvent, id: string) => {
    e.preventDefault();
    if (dragItemRef.current?.type === "category") {
      setDragOverCategoryId(id);
    }
  };

  const handleDropCategory = (_e: DragEvent, targetId: string) => {
    const dragged = dragItemRef.current;
    if (!dragged || dragged.type !== "category" || dragged.id === targetId) {
      setDragOverCategoryId(null);
      return;
    }
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const targetIdx = sorted.findIndex((c) => c.id === targetId);
    const prev = sorted[targetIdx - 1];
    const next = sorted[targetIdx];
    const newSortOrder = betweenSortOrders(prev?.sort_order, next?.sort_order);
    updateCategory.mutate({ id: dragged.id, sort_order: newSortOrder });
    setDragOverCategoryId(null);
    dragItemRef.current = null;
  };

  // ─── Drag handlers — items ───────────────────────────────────────────────────

  const handleDragStartItem = (
    e: DragEvent,
    itemId: string,
    categoryId: string
  ) => {
    dragItemRef.current = { type: "item", id: itemId, categoryId };
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverItem = (e: DragEvent, itemId: string) => {
    e.preventDefault();
    if (dragItemRef.current?.type === "item") {
      setDragOverItemId(itemId);
    }
  };

  const handleDropItem = (
    _e: DragEvent,
    targetItemId: string,
    targetCategoryId: string
  ) => {
    const dragged = dragItemRef.current;
    if (
      !dragged ||
      dragged.type !== "item" ||
      dragged.id === targetItemId ||
      dragged.categoryId !== targetCategoryId
    ) {
      setDragOverItemId(null);
      return;
    }
    const cat = categories.find((c) => c.id === targetCategoryId);
    if (!cat) {
      setDragOverItemId(null);
      return;
    }
    const sorted = [...cat.items].sort((a, b) => a.sort_order - b.sort_order);
    const targetIdx = sorted.findIndex((i) => i.id === targetItemId);
    const prev = sorted[targetIdx - 1];
    const next = sorted[targetIdx];
    const newSortOrder = betweenSortOrders(prev?.sort_order, next?.sort_order);
    updateItem.mutate({ id: dragged.id, sort_order: newSortOrder });
    setDragOverItemId(null);
    dragItemRef.current = null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <IncomeCard
        isAdmin={isAdmin}
        monthlyIncome={data?.settings.monthly_income ?? 0}
        onEditIncome={() => {
          // TODO: implement edit income modal
        }}
        totalFixed={totalFixed}
        variableRoom={variableRoom}
      />

      {categories.length === 0 && !isAddingCategory ? (
        <EmptyState onAdd={() => setIsAddingCategory(true)} />
      ) : (
        categories.map((cat) => (
          <CategoryBlock
            category={cat}
            dragOverItemId={dragOverItemId}
            editingItemId={editingItemId}
            isAdmin={isAdmin}
            isDragOverCategory={dragOverCategoryId === cat.id}
            key={cat.id}
            onDragOverCategory={handleDragOverCategory}
            onDragOverItem={handleDragOverItem}
            onDragStartCategory={handleDragStartCategory}
            onDragStartItem={handleDragStartItem}
            onDropCategory={handleDropCategory}
            onDropItem={handleDropItem}
            onEditItem={(id) => setEditingItemId(id)}
            onStopEditItem={() => setEditingItemId(null)}
          />
        ))
      )}

      {isAddingCategory && (
        <AddCategoryForm
          isSaving={createCategory.isPending}
          nextSortOrder={nextCategorySortOrder}
          onCancel={() => setIsAddingCategory(false)}
          onSave={(name) =>
            createCategory.mutate({ name, sort_order: nextCategorySortOrder })
          }
        />
      )}

      {(categories.length > 0 || totalFixed > 0) && (
        <div
          style={{
            color: "var(--red)",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "right",
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          Total monthly fixed costs&nbsp;&nbsp;&nbsp;
          {formatNegativeCurrency(totalFixed)} / month
        </div>
      )}
    </div>
  );
}

// ─── Add category inline form ─────────────────────────────────────────────────

function AddCategoryForm({
  onSave,
  onCancel,
  isSaving,
}: {
  nextSortOrder: number;
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1.5px solid var(--accent)",
        borderRadius: "var(--r-lg)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <input
        autoFocus
        disabled={isSaving}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder="Category name"
        style={{
          flex: 1,
          background: "var(--surface-raised)",
          border: "1.5px solid var(--accent)",
          borderRadius: "var(--r-sm)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
          padding: "6px 10px",
          outline: "none",
        }}
        value={name}
      />
      <button
        disabled={isSaving || !name.trim()}
        onClick={handleSave}
        style={{
          ...primaryButtonStyle,
          opacity: name.trim() ? 1 : 0.5,
        }}
        type="button"
      >
        Save
      </button>
      <button onClick={onCancel} style={ghostButtonStyle} type="button">
        Cancel
      </button>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const bar = (w: string | number, h: number) =>
    ({
      background: "var(--surface-raised)",
      borderRadius: "var(--r-sm)",
      width: w,
      height: h,
      animation: "pulse 1.4s ease-in-out infinite",
    }) as const;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Income card skeleton */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={bar(40, 40)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={bar(120, 10)} />
            <div style={bar(100, 22)} />
          </div>
          <div style={{ width: 1, height: 32, background: "var(--border)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={bar(60, 10)} />
            <div style={bar(80, 14)} />
          </div>
        </div>

        {/* Category skeletons */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "var(--surface-raised)",
                height: 42,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 12,
              }}
            >
              <div style={bar(80, 12)} />
              <div style={{ flex: 1 }} />
              <div style={bar(60, 12)} />
            </div>
            {[0, 1].map((j) => (
              <div
                key={j}
                style={{
                  height: 42,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: 12,
                  borderBottom:
                    j === 0 ? "1px solid var(--border-sub)" : "none",
                }}
              >
                <div style={bar("40%", 11)} />
                <div style={{ flex: 1 }} />
                <div style={bar(60, 11)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "64px 0",
        color: "var(--text-3)",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500 }}>
        No budget categories yet
      </span>
      <button onClick={onAdd} style={primaryButtonStyle} type="button">
        <IconPlus size={14} />
        Add First Category
      </button>
    </div>
  );
}
