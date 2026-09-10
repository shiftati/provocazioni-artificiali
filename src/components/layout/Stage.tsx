import type { FC, ReactNode } from "react";
import { useStageScale } from "../../hooks/useStageScale";
import styles from "./Stage.module.scss";

export interface StageProps {
  children: ReactNode;
  className?: string;
}

export const Stage: FC<StageProps> = ({ children, className = "" }) => {
  const { containerRef, scale, width, height } = useStageScale();

  return (
    <div
      ref={containerRef}
      className={`${styles.stageViewport} ${className}`}
      data-testid="stage-viewport"
    >
      <div
        className={styles.stageCanvas}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
