import type { FC } from "react";
import type { IconProps } from "./types";

export const StepBackIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);
