import type { FC } from "react";
import type { IconProps } from "./types";

export const SlidesIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M19 3H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h4v2l-3.2 2.1c-.44.29-.56.9-.27 1.34.29.44.9.56 1.34.27L11 20.2V22h2v-1.8l4.13 2.51c.44.29 1.05.17 1.34-.27.29-.44.17-1.05-.27-1.34L15 19v-2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H5V5h14v8zM7 7h10v2H7zm0 3.5h6v2H7z" />
  </svg>
);
