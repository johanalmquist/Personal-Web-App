import type { MasterBudgetCategoryWithItems } from "@personal/types";
import type { DragEvent } from "react";
import { useState } from "react";
import {
  useDeleteCategory,
  useDeleteMasterItem,
  useUpdateCategory,
  useUpdateMasterItem,
} from "../../hooks/use-master-budget";
import { AddItemRow } from "./add-item-row";
import { BudgetItemRow } from "./budget-item-row";
import { BudgetItemRowEditing } from "./budget-item-row-editing";
import { CategoryHeader } from "./category-header";

interface CategoryBlockProps {
  category: MasterBudgetCategoryWithItems;
  dragOverItemId: string | null;
  editingItemId: string | null;
  isAdmin: boolean;
  isDragOverCategory: boolean;
  onDragOverCategory: (e: DragEvent, id: string) => void;
  onDragOverItem: (e: DragEvent, itemId: string) => void;
  // Category drag
  onDragStartCategory: (e: DragEvent, id: string) => void;
  // Item drag
  onDragStartItem: (e: DragEvent, itemId: string, categoryId: string) => void;
  onDropCategory: (e: DragEvent, targetId: string) => void;
  onDropItem: (
    e: DragEvent,
    targetItemId: string,
    targetCategoryId: string
  ) => void;
  onEditItem: (id: string) => void;
  onStopEditItem: () => void;
}

export function CategoryBlock({
  category,
  isAdmin,
  editingItemId,
  onEditItem,
  onStopEditItem,
  onDragStartCategory,
  onDragOverCategory,
  onDropCategory,
  isDragOverCategory,
  onDragStartItem,
  onDragOverItem,
  onDropItem,
  dragOverItemId,
}: CategoryBlockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateItem = useUpdateMasterItem();
  const deleteItem = useDeleteMasterItem();

  const sortedItems = [...category.items].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const total = sortedItems.reduce((s, i) => s + i.default_amount, 0);
  const nextItemSortOrder =
    sortedItems.length > 0
      ? Math.max(...sortedItems.map((i) => i.sort_order)) + 1000
      : 1000;

  const handleEditHeaderSave = () => {
    if (editName.trim() && editName.trim() !== category.name) {
      updateCategory.mutate(
        { id: category.id, name: editName.trim() },
        { onSettled: () => setIsEditingHeader(false) }
      );
    } else {
      setIsEditingHeader(false);
    }
  };

  const handleEditHeaderCancel = () => {
    setIsEditingHeader(false);
    setEditName(category.name);
  };

  const handleDeleteCategory = () => {
    // biome-ignore lint/suspicious/noAlert: intentional confirm for destructive action
    if (window.confirm(`Delete "${category.name}" and all its items?`)) {
      deleteCategory.mutate(category.id);
    }
  };

  const handleSaveItem = (itemId: string, name: string, amount: number) => {
    updateItem.mutate(
      { id: itemId, name, default_amount: amount },
      { onSettled: () => onStopEditItem() }
    );
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    // biome-ignore lint/suspicious/noAlert: intentional confirm for destructive action
    if (window.confirm(`Delete "${itemName}"?`)) {
      deleteItem.mutate(itemId);
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
      }}
    >
      <CategoryHeader
        category={category}
        editName={editName}
        isAdmin={isAdmin}
        isDragOver={isDragOverCategory}
        isEditing={isEditingHeader}
        isOpen={isOpen}
        itemCount={sortedItems.length}
        onDelete={handleDeleteCategory}
        onDragOver={(e) => onDragOverCategory(e, category.id)}
        onDragStart={(e) => onDragStartCategory(e, category.id)}
        onDrop={(e) => onDropCategory(e, category.id)}
        onEdit={() => {
          setEditName(category.name);
          setIsEditingHeader(true);
        }}
        onEditCancel={handleEditHeaderCancel}
        onEditNameChange={setEditName}
        onEditSave={handleEditHeaderSave}
        onToggle={() => setIsOpen((v) => !v)}
        total={total}
      />

      {isOpen && (
        <>
          {sortedItems.map((item, idx) =>
            editingItemId === item.id ? (
              <BudgetItemRowEditing
                isSaving={updateItem.isPending}
                item={item}
                key={item.id}
                onCancel={onStopEditItem}
                onSave={(name, amount) => handleSaveItem(item.id, name, amount)}
              />
            ) : (
              <BudgetItemRow
                isAdmin={isAdmin}
                isDragOver={dragOverItemId === item.id}
                isLast={idx === sortedItems.length - 1 && !isAdmin}
                item={item}
                key={item.id}
                onDelete={() => handleDeleteItem(item.id, item.name)}
                onDragOver={(e) => onDragOverItem(e, item.id)}
                onDragStart={(e) => onDragStartItem(e, item.id, category.id)}
                onDrop={(e) => onDropItem(e, item.id, category.id)}
                onEdit={() => onEditItem(item.id)}
              />
            )
          )}

          {isAdmin && (
            <AddItemRow
              categoryId={category.id}
              nextSortOrder={nextItemSortOrder}
              onAdded={onStopEditItem}
            />
          )}
        </>
      )}
    </div>
  );
}
