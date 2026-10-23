import type { FC } from "react";
import type { IconProps } from "./types";

export const VideoIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);
