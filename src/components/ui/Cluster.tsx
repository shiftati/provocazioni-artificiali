import type { HTMLAttributes, ReactNode, FC } from "react";
import styles from "./LayoutPrimitives.module.scss";
import type { SpacingScale, Alignment, Justification } from "./Stack";

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpacingScale;
  align?: Alignment;
  justify?: Justification;
  children: ReactNode;
}

const gapClassMap: Record<SpacingScale, string> = {
  1: styles.gap1 ?? "",
  2: styles.gap2 ?? "",
  3: styles.gap3 ?? "",
  4: styles.gap4 ?? "",
  6: styles.gap6 ?? "",
  8: styles.gap8 ?? "",
  12: styles.gap12 ?? "",
  16: styles.gap16 ?? "",
};

const alignClassMap: Record<Alignment, string> = {
  start: styles.alignStart ?? "",
  center: styles.alignCenter ?? "",
  end: styles.alignEnd ?? "",
  stretch: styles.alignStretch ?? "",
};

const justifyClassMap: Record<Justification, string> = {
  start: styles.justifyStart ?? "",
  center: styles.justifyCenter ?? "",
  end: styles.justifyEnd ?? "",
  between: styles.justifyBetween ?? "",
};

export const Cluster: FC<ClusterProps> = ({
  gap = 4,
  align = "center",
  justify = "start",
  className = "",
  children,
  ...props
}) => {
  const gapClass = gapClassMap[gap] ?? "";
  const alignClass = alignClassMap[align] ?? "";
  const justifyClass = justifyClassMap[justify] ?? "";

  return (
    <div
      className={`${styles.cluster ?? ""} ${gapClass} ${alignClass} ${justifyClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
