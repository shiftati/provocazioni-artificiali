import type { FC, ReactNode } from "react";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./ProvocationCard.module.scss";

export interface ProvocationCardProps {
  imageName?: string;
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const ProvocationCard: FC<ProvocationCardProps> = ({
  imageName,
  children,
  className = "",
  ariaLabel,
}) => {
  const cleanImageName = imageName?.replace(/^images\/provocations\//, "");
  const imageUrl = cleanImageName
    ? cleanImageName.startsWith("images/")
      ? `${BASE_URL}${encodeURI(cleanImageName.normalize("NFC"))}`
      : `${BASE_URL}images/provocations/${encodeURI(cleanImageName.normalize("NFC"))}`
    : "";
  const effectiveImageUrl = useCachedAsset(imageUrl);

  return (
    <div
      className={`${styles.provocationCard} ${className}`}
      style={
        effectiveImageUrl
          ? { backgroundImage: `url("${effectiveImageUrl}")` }
          : undefined
      }
      role="region"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};
