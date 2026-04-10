"use client";

import { useEffect, useRef } from "react";

/**
 * Focus trap — Session 5 §2 a11y depth.
 *
 * Wrap modal/dialog children. Tab and Shift+Tab cycle within the
 * trap; Escape calls `onClose` if provided. Restores focus to the
 * previously focused element on unmount.
 */

export interface FocusTrapProps {
  active?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function FocusTrap({ active = true, onClose, children }: FocusTrapProps): JSX.Element {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = root.current;
    if (!node) return;

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape" && onClose) {
        ev.stopPropagation();
        onClose();
        return;
      }
      if (ev.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }

    node.addEventListener("keydown", onKey);
    return () => {
      node.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [active, onClose]);

  return <div ref={root}>{children}</div>;
}
