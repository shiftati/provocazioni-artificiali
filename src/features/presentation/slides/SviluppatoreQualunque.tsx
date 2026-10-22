import type { FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import { useCachedAsset } from "../../../hooks/useCachedAsset";
import styles from "./SviluppatoreQualunque.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const SviluppatoreQualunque: FC = () => {
  const metromanUrl = useCachedAsset(`${BASE_URL}images/slides/metroman.webp`);

  return (
    <ImageSlide
      imageName="codemotion-blue-bg.webp"
      title="Developer qualunque"
    >
      <div className={styles.metromanContainer}>
        <img
          src={metromanUrl}
          alt="Metroman - Developer qualunque"
          className={styles.metromanImage}
        />
      </div>
    </ImageSlide>
  );
};
