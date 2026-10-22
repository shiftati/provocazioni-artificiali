import {useState, useRef, useEffect, type FC} from "react";
import {ImageSlide} from "../layouts/ImageSlide";
import {useAppState} from "../../../state/AppStateContext";
import type {SlideProps} from "../../../types";
import styles from "./FightClub.module.scss";

export const FightClub: FC<SlideProps> = ({step: stepProp, isReplay = false}) => {
    const {registerSlideStepHandler, previousSlideIndex} = useAppState();

    // Se l'utente arriva a ritroso da una slide successiva (indice > 7),
    // inizializziamo la slide con tutte le 3 card già visibili (step 3)
    const isEnteredBackwards = useRef(
        !isReplay && typeof previousSlideIndex === "number" && previousSlideIndex > 7,
    ).current;

    // Step 0: Nessuna card (solo sfondo Fight Club)
    // Step 1: 1° click -> compare card sinistra (Dovete parlare) con ingresso da sinistra
    // Step 2: 2° click -> compare card destra (30 secondi) con ingresso da destra
    // Step 3: 3° click -> compare card in basso al centro (5 minuti categorici) con ingresso dal basso
    // 4° click -> avanza alla slide successiva
    const [localStep, setLocalStep] = useState<number>(() => (isEnteredBackwards ? 3 : 0));
    const stepRef = useRef(localStep);
    stepRef.current = localStep;

    // Se siamo in modalità replay di sessione, utilizziamo il passo fornito come prop
    const currentStep = stepProp !== undefined ? stepProp : localStep;

    // Traccia la direzione di navigazione sincronizzata direttamente durante il rendering
    const [direction, setDirection] = useState<"forward" | "backward" | "none">(
        () => (isEnteredBackwards ? "none" : "forward"),
    );

    const prevStepRef = useRef<number>(currentStep);
    if (currentStep !== prevStepRef.current) {
        const newDirection = currentStep > prevStepRef.current ? "forward" : "backward";
        prevStepRef.current = currentStep;
        if (direction !== newDirection) {
            setDirection(newDirection);
        }
    }

    useEffect(() => {
        if (isReplay) return;

        registerSlideStepHandler({
            onNext: () => {
                if (stepRef.current < 3) {
                    const nextStep = stepRef.current + 1;
                    stepRef.current = nextStep;
                    setDirection("forward");
                    setLocalStep(nextStep);
                    return true; // Consumato: non cambia slide
                }
                return false; // Tutte le card sono visibili: avanza alla slide successiva
            },
            onPrev: () => {
                if (stepRef.current > 0) {
                    const prevStep = stepRef.current - 1;
                    stepRef.current = prevStep;
                    setDirection("backward");
                    setLocalStep(prevStep);
                    return true; // Consumato: non cambia slide
                }
                return false; // Torna alla slide precedente
            },
            getCurrentStep: () => stepRef.current,
            getStepDescription: (s) =>
                s === 1
                    ? "Regola 1: Dovete parlare"
                    : s === 2
                        ? "Regola 2: 30 secondi per proporre"
                        : s === 3
                            ? "Regola 3: 5 minuti categorici per discutere"
                            : "Nessuna card (inizio)",
        });

        return () => {
            registerSlideStepHandler(null);
        };
    }, [registerSlideStepHandler, isReplay]);

    const isCard1Visible = currentStep >= 1;
    const isCard2Visible = currentStep >= 2;
    const isCard3Visible = currentStep >= 3;

    const isForward = direction === "forward" || isReplay;

    const card1Class = isCard1Visible
        ? isForward && currentStep === 1
            ? styles.card1Entrance
            : styles.card1Static
        : styles.card1Hidden;

    const card2Class = isCard2Visible
        ? isForward && currentStep === 2
            ? styles.card2Entrance
            : styles.card2Static
        : styles.card2Hidden;

    const card3Class = isCard3Visible
        ? isForward && currentStep === 3
            ? styles.card3Entrance
            : styles.card3Static
        : styles.card3Hidden;

    return (
        <ImageSlide
            imageName="fight-club.jpg"
            title="Fight club"
            className={styles.slideContainer}
        >
            {/* 1° Card: Sinistra - Dovete parlare */}
            <div
                className={`${styles.ruleCard} ${styles.card1} ${card1Class}`}
                role="region"
                aria-label="Regola 1: Dovete parlare"
                aria-hidden={!isCard1Visible}
            >
                <div className={`${styles.badge} ${styles.badge1}`}>
                    <span>REGOLA #1</span>
                </div>
                <p className={styles.cardText}>
                    <strong className={styles.highlight1}><em>DOVETE</em></strong> PARLARE!
                </p>
                <p className={styles.cardSubtext}>
                    (esattamente il contrario del "Fight Club")
                </p>
            </div>

            {/* 2° Card: Destra - 30 secondi per proporre */}
            <div
                className={`${styles.ruleCard} ${styles.card2} ${card2Class}`}
                role="region"
                aria-label="Regola 2: 30 secondi per proporre la vostra provocazione"
                aria-hidden={!isCard2Visible}
            >
                <div className={`${styles.badge} ${styles.badge2}`}>
                    <span>REGOLA #2</span>
                </div>
                <p className={styles.cardText}>
                    <strong className={styles.highlight2}>30 secondi</strong> per proporre
                    la vostra provocazione
                </p>
                <p className={styles.cardSubtext}>
                    (per alzata di mano: il più veloce propone)
                </p>
            </div>

            {/* 3° Card: In basso al centro - 5 minuti categorici */}
            <div
                className={`${styles.ruleCard} ${styles.card3} ${card3Class}`}
                role="region"
                aria-label="Regola 3: 5 minuti categorici per discutere sulla provocazione"
                aria-hidden={!isCard3Visible}
            >
                <div className={`${styles.badge} ${styles.badge3}`}>
                    <span>REGOLA #3</span>
                </div>
                <p className={styles.cardText}>
                    <strong className={styles.highlight3}>5 minuti categorici</strong> <br/> per
                    discutere sulla provocazione
                </p>
            </div>
        </ImageSlide>
    );
};
