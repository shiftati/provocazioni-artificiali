import type { FC, ReactNode } from "react";
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

  return (
    <div
      className={`${styles.imageSlide} ${className}`}
      style={{
        backgroundImage: `url("${imageUrl}")`,
      }}
      role="region"
      aria-label={title || imageName}
    >
      {children}
    </div>
  );
};
