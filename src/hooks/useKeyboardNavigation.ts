import { useEffect } from "react";

export interface KeyboardNavigationOptions {
  onNext?: () => void;
  onPrev?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onNext,
  onPrev,
  enabled = true,
}: KeyboardNavigationOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events originating inside inputs, textareas, contenteditable or select
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ": // Spacebar commonly used by clickers
          event.preventDefault();
          if (onNext) onNext();
          break;

        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          if (onPrev) onPrev();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrev, enabled]);
}
