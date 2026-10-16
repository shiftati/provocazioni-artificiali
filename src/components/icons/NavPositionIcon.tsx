import type { FC } from "react";
import type { IconProps } from "./types";

export const NavPositionIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Screen / Canvas outline */}
    <path d="M20 4H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6v2H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-2v-2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 12H4V6h16v10z" />
    {/* Left navigation arrow on screen */}
    <path d="M7 11l2.5-2.5v1.5h2v2h-2v1.5z" />
    {/* Right navigation arrow on screen */}
    <path d="M17 11l-2.5-2.5v1.5h-2v2h2v1.5z" />
  </svg>
);
