import { useEffect, type ReactNode, type FC } from "react";
import styles from "./Modal.module.scss";

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  fullscreen?: boolean;
  children: ReactNode;
  ariaLabel?: string;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  fullscreen = false,
  children,
  ariaLabel = "Dialogo a schermo intero",
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.backdrop} ${fullscreen ? styles.fullscreenBackdrop : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className={`${styles.modal} ${fullscreen ? styles.fullscreenModal : ""}`}>
        {children}
      </div>
    </div>
  );
};
