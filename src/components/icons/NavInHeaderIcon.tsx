import type { FC } from "react";
import type { IconProps } from "./types";

export const NavInHeaderIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
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
    <path d="M4 9.5h16v1H4z" />
    {/* Left navigation arrow in top header bar */}
    <path d="M7 7.8l2-1.5v0.9h2v1.2h-2v0.9z" />
    {/* Right navigation arrow in top header bar */}
    <path d="M17 7.8l-2-1.5v0.9h-2v1.2h2v0.9z" />
    {/* Header indicator dot */}
    <path d="M11.5 7.3h1v1h-1z" />
    {/* Slide canvas content lines */}
    <path d="M6 12h12v1.2H6z" />
    <path d="M6 14h8v1.2H6z" />
  </svg>
);
