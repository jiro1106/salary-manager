import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  /** "alertdialog" for a confirmation, "dialog" for a form. */
  role: "dialog" | "alertdialog";
  labelledBy: string;
  describedBy?: string;
  /** What takes focus on open. */
  initialFocus: RefObject<HTMLElement>;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const isFocusable = (el: HTMLElement) =>
  !(el as HTMLButtonElement).disabled && el.getAttribute("aria-disabled") !== "true";

/**
 * The scrim and panel every dialog shares. Focus moves in on open, is
 * trapped inside, Escape and a scrim click close, and focus goes back to
 * whatever opened it on close. Native <dialog> would do the trap for
 * free, but jsdom has no showModal, so the tests could not open one.
 */
export default function Modal({
  role,
  labelledBy,
  describedBy,
  initialFocus,
  onClose,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Read through a ref so an inline onClose does not re-run the effect,
  // which would steal focus back to initialFocus on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    initialFocus.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter(isFocusable);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-page-x py-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-dialog overflow-y-auto rounded-slab border border-line bg-card px-stack py-6"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
