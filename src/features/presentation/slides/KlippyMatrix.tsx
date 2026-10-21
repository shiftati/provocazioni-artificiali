import type { FC } from "react";
import { ImageSlide } from "../layouts/ImageSlide";
import styles from "./KlippyMatrix.module.scss";

export const KlippyMatrix: FC = () => {
  return (
    <ImageSlide imageName="11-klippy-matrix.jpg" title="Klippy matrix">
      <div className={styles.captionContainer}>
        <div className={styles.captionBadge}>
          La documentazione non ha più senso
        </div>
      </div>
    </ImageSlide>
  );
};
