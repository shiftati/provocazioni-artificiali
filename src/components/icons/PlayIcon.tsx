import type { FC } from "react";
import type { IconProps } from "./types";

export const PlayIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M8 5v14l11-7z" />
  </svg>
);
