import type { FC } from "react";
import type { IconProps } from "./types";

export const NavOnSlideIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Screen frame and stand */}
    <path d="M20 4H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6v2H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-2v-2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 12H4V6h16v10z" />
    {/* Header bar divider line */}
    <path d="M4 8.5h16v1H4z" />
    {/* Left navigation arrow on slide canvas */}
    <path d="M6.5 12.5l2.5-2.2v1.4h2v1.6h-2v1.4z" />
    {/* Right navigation arrow on slide canvas */}
    <path d="M17.5 12.5l-2.5-2.2v1.4h-2v1.6h2v1.4z" />
    {/* Slide indicator dot */}
    <path d="M11.5 12h1v1h-1z" />
  </svg>
);
