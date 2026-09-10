import type { HTMLAttributes, ReactNode, FC } from "react";
import styles from "./LayoutPrimitives.module.scss";

export type SpacingScale = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;
export type Alignment = "start" | "center" | "end" | "stretch";
export type Justification = "start" | "center" | "end" | "between";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
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

export const Stack: FC<StackProps> = ({
  gap = 4,
  align = "stretch",
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
      className={`${styles.stack ?? ""} ${gapClass} ${alignClass} ${justifyClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
