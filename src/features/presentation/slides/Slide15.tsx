import type { FC } from "react";
import styles from "./Slide15.module.scss";

export const Slide15: FC = () => {
  return (
    <div
      className={styles.blackSlide}
      role="region"
      aria-label="Slide nera"
    />
  );
};
