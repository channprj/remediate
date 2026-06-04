import { useState, useCallback, useEffect, type RefObject } from "react";
import type { BarEdge } from "../types";
import { readBarState, patchBarState } from "../utils/bar-storage";

const TAB_PEEK = 20; // px of the bar that stays visible when collapsed

function collapseTranslate(rect: DOMRect, edge: BarEdge): string {
  switch (edge) {
    case "right":
      return `translate(${window.innerWidth - rect.left - TAB_PEEK}px, 0)`;
    case "left":
      return `translate(${TAB_PEEK - rect.right}px, 0)`;
    case "bottom":
      return `translate(0, ${window.innerHeight - rect.top - TAB_PEEK}px)`;
    case "top":
      return `translate(0, ${TAB_PEEK - rect.bottom}px)`;
  }
}

export function useCollapsible({
  collapsible,
  edge,
  barRef,
}: {
  collapsible: boolean;
  edge: BarEdge;
  barRef: RefObject<HTMLDivElement | null>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted collapsed state — only when the feature is enabled.
  useEffect(() => {
    if (!collapsible) return;
    if (readBarState()?.collapsed) setCollapsed(true);
  }, [collapsible]);

  // Apply / clear the collapse transform; recompute on resize while collapsed.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (!collapsible || !collapsed) {
      bar.style.transform = "";
      return;
    }

    const apply = () => {
      const b = barRef.current;
      if (!b) return;
      b.style.transform = "";
      const rect = b.getBoundingClientRect();
      b.style.transform = collapseTranslate(rect, edge);
    };
    apply();

    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      const b = barRef.current;
      if (b) b.style.transform = "";
    };
  }, [collapsible, collapsed, edge, barRef]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      patchBarState({ collapsed: next });
      return next;
    });
  }, []);

  return { collapsed: collapsible ? collapsed : false, toggleCollapsed };
}
