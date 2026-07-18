"use client";

import React, { useState } from "react";

import { cn } from "../../lib";

export interface TreeParentMeta {
  isExpanded: boolean;
  toggle: () => void;
  childCount: number;
}

export interface TreeItem<TParent, TChild> {
  parent: TParent;
  items: TChild[];
}

interface TreeGroupProps<TParent, TChild> {
  parent: TParent;
  items: TChild[];
  renderParent: (parent: TParent, meta: TreeParentMeta) => React.ReactNode;
  renderChild: (child: TChild, index: number, parent: TParent) => React.ReactNode;
  renderFooter?: (items: TChild[], parent: TParent) => React.ReactNode;
  defaultExpanded?: boolean;
  /** px offset for the vertical anchor line. Aligns it under the parent expand icon. Default: 20 */
  anchorOffset?: number;
  className?: string;
}

interface TreeProps<TParent, TChild> {
  items: TreeItem<TParent, TChild>[];
  renderParent: (parent: TParent, meta: TreeParentMeta) => React.ReactNode;
  renderChild: (child: TChild, index: number, parent: TParent) => React.ReactNode;
  renderFooter?: (items: TChild[], parent: TParent) => React.ReactNode;
  defaultExpanded?: boolean;
  anchorOffset?: number;
  getKey: (parent: TParent) => string;
  className?: string;
  emptyState?: React.ReactNode;
}

function TreeGroup<TParent, TChild>({
  parent,
  items,
  renderParent,
  renderChild,
  renderFooter,
  defaultExpanded = false,
  anchorOffset = 20,
  className,
}: TreeGroupProps<TParent, TChild>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const toggle = () => setIsExpanded((prev) => !prev);

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      {renderParent(parent, { isExpanded, toggle, childCount: items.length })}
      {isExpanded && (
        <div className="border-l border-gray-200" style={{ marginLeft: anchorOffset }}>
          {items.map((child, index) => (
            <React.Fragment key={index}>{renderChild(child, index, parent)}</React.Fragment>
          ))}
          {renderFooter && renderFooter(items, parent)}
        </div>
      )}
    </div>
  );
}

export function Tree<TParent, TChild>({
  items,
  renderParent,
  renderChild,
  renderFooter,
  defaultExpanded,
  anchorOffset,
  getKey,
  className,
  emptyState,
}: TreeProps<TParent, TChild>) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        {emptyState ?? "No items to display"}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <TreeGroup
          key={getKey(item.parent)}
          parent={item.parent}
          items={item.items}
          renderParent={renderParent}
          renderChild={renderChild}
          renderFooter={renderFooter}
          defaultExpanded={defaultExpanded}
          anchorOffset={anchorOffset}
        />
      ))}
    </div>
  );
}

export type { TreeProps, TreeGroupProps };
