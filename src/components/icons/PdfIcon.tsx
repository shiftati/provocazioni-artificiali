import type { FC } from "react";
import type { IconProps } from "./types";

export const PdfIcon: FC<IconProps> = ({ size = "1em", title, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2v-3h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm5 2h-2v-5h2c.83 0 1.5.67 1.5 1.5v2c0 .83-.67 1.5-1.5 1.5zm-3.5-3.5h1v2h-1v-2zm-3-1.5h1v1h-1v-1zm11 8.5H5V5h14v14z" />
  </svg>
);
