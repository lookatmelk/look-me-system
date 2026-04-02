"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

type UseKeyboardTableNavigationOptions<T> = {
  rows: T[];
  onOpenRow?: (row: T) => void;
  onDeleteRow?: (row: T) => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  return Boolean(target.closest("input, textarea, select"));
}

export function useKeyboardTableNavigation<T>({
  rows,
  onOpenRow,
  onDeleteRow,
}: UseKeyboardTableNavigationOptions<T>) {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndexState, setSelectedIndex] = useState(0);

  const rowCount = rows.length;
  const selectedIndex = rowCount === 0 ? 0 : Math.min(selectedIndexState, rowCount - 1);

  useEffect(() => {
    const root = tableRef.current;
    if (!root || rowCount === 0) return;

    const selectedRow = root.querySelector<HTMLElement>(`[data-kb-row-index='${selectedIndex}']`);
    selectedRow?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, rowCount]);

  const selectedRow = useMemo(() => rows[selectedIndex], [rows, selectedIndex]);

  const handleTableKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (rowCount === 0) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex(selectedIndex + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setSelectedIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setSelectedIndex(rowCount - 1);
        return;
      }

      if (event.key === "Enter" && onOpenRow && selectedRow) {
        event.preventDefault();
        onOpenRow(selectedRow);
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        onDeleteRow &&
        selectedRow &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        onDeleteRow(selectedRow);
      }
    },
    [onDeleteRow, onOpenRow, rowCount, selectedIndex, selectedRow],
  );

  return {
    tableRef,
    selectedIndex,
    setSelectedIndex,
    handleTableKeyDown,
  };
}
