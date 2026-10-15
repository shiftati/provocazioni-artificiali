import type { FC, ReactNode } from "react";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./ImageSlide.module.scss";

export interface ImageSlideProps {
  imageName: string;
  title?: string;
  children?: ReactNode;
  className?: string;
}

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const ImageSlide: FC<ImageSlideProps> = ({
  imageName,
  title,
  children,
  className = "",
}) => {
  const imageUrl = `${BASE_URL}images/slides/${encodeURI(imageName.normalize("NFC"))}`;
  const effectiveImageUrl = useCachedAsset(imageUrl);

  return (
    <div
      className={`${styles.imageSlide} ${className}`}
      style={{
        backgroundImage: `url("${effectiveImageUrl}")`,
      }}
      role="region"
      aria-label={title || imageName}
    >
      {children}
    </div>
  );
};
