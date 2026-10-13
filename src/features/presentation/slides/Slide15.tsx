import { useEffect, useRef, useState, useCallback, type FC } from "react";
import { PlayIcon, PauseIcon, StopIcon } from "../../../components/icons";
import styles from "./Slide15.module.scss";

const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const Slide15: FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Background audio autoplay and cleanup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.8;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Autoplay was prevented by browser policy:", err);
          setIsPlaying(false);
        });
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const handleStart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Audio play error:", err));
    }
  }, []);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className={styles.slideContainer} role="region" aria-label="Slide Finale - Contatti">
      {/* Background audio element */}
      <audio
        ref={audioRef}
        src={`${BASE_URL}audio/back-to-the-future.mp3`}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <header className={styles.header}>
        <span className={styles.eyebrow}>Grazie a tutti!</span>
        <span className={styles.talkMeta}>Shiftati di Testa • Codemotion 2026</span>
      </header>

      <div className={styles.body}>
        <div className={styles.cardsGrid}>
          {/* Daniel Zotti Card */}
          <div className={`${styles.profileCard} ${styles.cardDaniel}`}>
            <div className={styles.profileHeader}>
              <div className={`${styles.avatarWrapper} ${styles.avatarDaniel}`}>
                <img
                  src={`${BASE_URL}images/daniel.png`}
                  alt="Daniel Zotti"
                  className={styles.avatarImg}
                />
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.name}>Daniel Zotti</h2>
                <a
                  href="https://www.danielzotti.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteLink}
                >
                  www.danielzotti.it
                </a>
              </div>
            </div>

            <div className={styles.qrSection}>
              <a
                href="https://www.danielzotti.it"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.qrCard}
                title="Apri il sito di Daniel Zotti"
              >
                <img
                  src={`${BASE_URL}images/qr-daniel.svg`}
                  alt="QR Code Daniel Zotti (www.danielzotti.it)"
                  className={styles.qrImg}
                />
              </a>
              <span className={styles.qrBadge}>Scansiona per il sito web</span>
            </div>
          </div>

          {/* Stefano Bruno Card */}
          <div className={`${styles.profileCard} ${styles.cardStefano}`}>
            <div className={styles.profileHeader}>
              <div className={`${styles.avatarWrapper} ${styles.avatarStefano}`}>
                <img
                  src={`${BASE_URL}images/stefano.png`}
                  alt="Stefano Bruno"
                  className={styles.avatarImg}
                />
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.name}>Stefano Bruno</h2>
                <a
                  href="https://www.linkedin.com/in/stefano-bruno/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteLink}
                >
                  www.linkedin.com/in/stefano-bruno/
                </a>
              </div>
            </div>

            <div className={styles.qrSection}>
              <a
                href="https://www.linkedin.com/in/stefano-bruno/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.qrCard}
                title="Apri il profilo LinkedIn di Stefano Bruno"
              >
                <img
                  src={`${BASE_URL}images/qr-stefano.svg`}
                  alt="QR Code LinkedIn Stefano Bruno"
                  className={styles.qrImg}
                />
              </a>
              <span className={styles.qrBadge}>Scansiona per il profilo LinkedIn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controlli audio in basso a destra in piccolo */}
      <aside className={styles.audioControls} aria-label="Controlli audio di sottofondo">
        <div className={styles.audioStatus}>
          <span
            className={`${styles.audioEqualizer} ${isPlaying ? styles.isPlaying : ""}`}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
          <span className={styles.audioTrackName}>BTTF Theme</span>
        </div>

        <div className={styles.audioButtonGroup}>
          <button
            type="button"
            className={`${styles.audioBtn} ${isPlaying ? styles.audioBtnActive : ""}`}
            onClick={handleStart}
            title="Start audio"
            aria-label="Start audio"
          >
            <PlayIcon size={12} />
            <span>Start</span>
          </button>
          <button
            type="button"
            className={`${styles.audioBtn} ${!isPlaying ? styles.audioBtnActive : ""}`}
            onClick={handlePause}
            title="Pausa audio"
            aria-label="Pausa audio"
          >
            <PauseIcon size={12} />
            <span>Pausa</span>
          </button>
          <button
            type="button"
            className={styles.audioBtn}
            onClick={handleStop}
            title="Stop audio"
            aria-label="Stop audio"
          >
            <StopIcon size={12} />
            <span>Stop</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
