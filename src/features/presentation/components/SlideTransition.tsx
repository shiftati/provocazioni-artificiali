import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  type FC,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { SlideTransitionType } from "../../../types";
import styles from "./SlideTransition.module.scss";

export interface SlideTransitionProps {
  currentKey: string | number;
  slideIndex?: number;
  direction?: "forward" | "backward" | "none";
  transitionType?: SlideTransitionType;
  durationMs?: number;
  children: ReactNode;
}

function createFrozenClone(sourceEl: HTMLElement): HTMLElement {
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  const sourceNodes = [sourceEl, ...Array.from(sourceEl.querySelectorAll("*"))] as HTMLElement[];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

  const count = Math.min(sourceNodes.length, cloneNodes.length);
  for (let i = 0; i < count; i++) {
    const src = sourceNodes[i];
    const dst = cloneNodes[i];
    if (src && dst) {
      try {
        const computed = window.getComputedStyle(src);
        if (computed.opacity) {
          dst.style.opacity = computed.opacity;
        }
        if (computed.transform && computed.transform !== "none") {
          dst.style.transform = computed.transform;
        }
        dst.style.animation = "none";
        dst.style.transition = "none";
      } catch {
        // Ignora eventuali nodi non stilizzabili
      }
    }
  }

  // Rimuovi audio e video dalla copia congelata per evitare playback duplicati
  clone.querySelectorAll("audio, video").forEach((media) => media.remove());
  clone.setAttribute("aria-hidden", "true");

  return clone;
}

export const SlideTransition: FC<SlideTransitionProps> = ({
  currentKey,
  direction = "none",
  transitionType = "fade-scale",
  durationMs = 600,
  children,
}) => {
  // Garantisce almeno mezzo secondo (500ms) come da richiesta utente
  const effectiveDuration = Math.max(500, durationMs);

  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activeDirection, setActiveDirection] = useState<"forward" | "backward" | "none">("none");
  const [activeTransitionType, setActiveTransitionType] = useState<SlideTransitionType>(transitionType);

  const incomingRef = useRef<HTMLDivElement>(null);
  const outgoingRef = useRef<HTMLDivElement>(null);
  const lastSnapshotRef = useRef<HTMLElement | null>(null);
  const prevKeyRef = useRef<string | number>(currentKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Aggiorna lo snapshot statico ogni volta che la slide visibile muta (es. animazioni interne a step)
  useEffect(() => {
    if (isTransitioning || !incomingRef.current) return;

    // Salva lo snapshot immediato
    try {
      lastSnapshotRef.current = createFrozenClone(incomingRef.current);
    } catch {
      // Ignora errori
    }

    // Osserva eventuali mutazioni DOM (es. click a step in DanielESte o Finale)
    const observer = new MutationObserver(() => {
      if (!incomingRef.current) return;
      try {
        lastSnapshotRef.current = createFrozenClone(incomingRef.current);
      } catch {
        // Ignora errori
      }
    });

    observer.observe(incomingRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [isTransitioning, currentKey]);

  // Gestione transizione quando cambia la chiave della slide
  useLayoutEffect(() => {
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;

      if (transitionType === "cut") {
        if (outgoingRef.current) {
          outgoingRef.current.innerHTML = "";
        }
        setIsTransitioning(false);
        if (incomingRef.current) {
          lastSnapshotRef.current = createFrozenClone(incomingRef.current);
        }
        return;
      }

      // Se abbiamo un elemento uscente precedente salvato
      if (outgoingRef.current) {
        outgoingRef.current.innerHTML = "";

        if (lastSnapshotRef.current) {
          const frozen = lastSnapshotRef.current.cloneNode(true) as HTMLElement;
          outgoingRef.current.appendChild(frozen);
        }

        setActiveDirection(direction);
        setActiveTransitionType(transitionType);
        setIsTransitioning(true);

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
          if (outgoingRef.current) {
            outgoingRef.current.innerHTML = "";
          }
          setIsTransitioning(false);
          // Cattura il nuovo snapshot completata la transizione
          if (incomingRef.current) {
            try {
              lastSnapshotRef.current = createFrozenClone(incomingRef.current);
            } catch {
              // Ignora
            }
          }
        }, effectiveDuration);
      }
    }
  }, [currentKey, direction, transitionType, effectiveDuration]);

  // Pulizia timer allo smontaggio
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Determina le classi di animazione in base al tipo e alla direzione
  let animOutgoingClass = "";
  let animIncomingClass = "";

  if (isTransitioning) {
    if (activeTransitionType === "fade") {
      animOutgoingClass = styles.animFadeOutgoing ?? "";
      animIncomingClass = styles.animFadeIncoming ?? "";
    } else if (activeTransitionType === "slide") {
      if (activeDirection === "backward") {
        animOutgoingClass = styles.animSlideOutgoingBackward ?? "";
        animIncomingClass = styles.animSlideIncomingBackward ?? "";
      } else {
        animOutgoingClass = styles.animSlideOutgoingForward ?? "";
        animIncomingClass = styles.animSlideIncomingForward ?? "";
      }
    } else if (activeTransitionType === "epic") {
      animOutgoingClass = styles.animEpicOutgoing ?? "";
      animIncomingClass = styles.animEpicIncoming ?? "";
    } else {
      // Default: "fade-scale"
      animOutgoingClass = styles.animFadeScaleOutgoing ?? "";
      animIncomingClass = styles.animFadeScaleIncoming ?? "";
    }
  }

  const cssVars: CSSProperties = {
    // @ts-expect-error custom CSS variable
    "--slide-transition-duration": `${effectiveDuration}ms`,
  };

  return (
    <div className={styles.transitionViewport} style={cssVars}>
      {/* Livello uscente con snapshot congelato */}
      <div
        ref={outgoingRef}
        className={`${styles.outgoingLayer ?? ""} ${animOutgoingClass}`}
        aria-hidden="true"
      />

      {/* Livello entrante con la slide React attiva */}
      <div
        ref={incomingRef}
        className={`${styles.incomingLayer ?? ""} ${
          isTransitioning ? animIncomingClass : (styles.incomingLayerIdle ?? "")
        }`}
      >
        {children}
      </div>

      {/* Epic Flash & Shockwave Overlay */}
      {isTransitioning && activeTransitionType === "epic" && (
        <div className={styles.epicShockwaveOverlay} aria-hidden="true">
          <div className={styles.epicFlashFlare} />
          <div className={styles.epicShockwaveRing} />
          <div className={styles.epicLaserStripe} />
        </div>
      )}
    </div>
  );
};
