"use client";

import { type ReactNode } from "react";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

/**
 * Vertical sortable list, same sensor setup as the shared Kanban so drag feels
 * identical across the product. The KeyboardSensor is not optional garnish:
 * reordering a course must be doable without a pointer (space to lift, arrows
 * to move, space to drop), so the drag handle is a real focusable button.
 *
 * The caller owns the order. onReorder hands back the full id list because the
 * catalog's reorder endpoints reject anything that isn't a complete permutation.
 */
export const SortableList = ({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (idsInOrder: string[]) => void;
  children: ReactNode;
}) => {
  const sensors = useSensors(
    // A few pixels of slop so clicking a button inside a row never reads as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};

/** Props to spread onto whatever element should act as the drag handle. */
export type DragHandleProps = Record<string, unknown>;

export const SortableItem = ({
  id,
  children,
}: {
  id: string;
  children: (handle: DragHandleProps) => ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-70" : undefined}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
};
