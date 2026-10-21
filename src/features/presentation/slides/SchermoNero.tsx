import type { FC } from "react";
import styles from "./SchermoNero.module.scss";

export const SchermoNero: FC = () => {
  return (
    <div
      className={styles.blackSlide}
      role="region"
      aria-label="Slide nera"
    />
  );
};
