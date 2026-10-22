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
    // Step 1: 1° click -> compare card sinistra (30 secondi) con ingresso da sinistra
    // Step 2: 2° click -> compare card destra (5 minuti) con ingresso da destra
    // Step 3: 3° click -> compare card in basso al centro (riparte il giro) con ingresso dal basso
    // 4° click -> avanza alla slide successiva (slide 9)
    const [localStep, setLocalStep] = useState<number>(() => (isEnteredBackwards ? 3 : 0));
    const stepRef = useRef(localStep);
    stepRef.current = localStep;

    // Se siamo in modalità replay di sessione, utilizziamo il passo fornito come prop
    const currentStep = stepProp !== undefined ? stepProp : localStep;

    // Traccia le card entrate in avanti per attivare l'animazione di ingresso con keyframe
    const [enteredForward, setEnteredForward] = useState<{
        card1: boolean;
        card2: boolean;
        card3: boolean;
    }>(() => ({
        card1: !isEnteredBackwards && currentStep >= 1,
        card2: !isEnteredBackwards && currentStep >= 2,
        card3: !isEnteredBackwards && currentStep >= 3,
    }));

    const prevStepRef = useRef<number>(currentStep);
    useEffect(() => {
        if (currentStep > prevStepRef.current) {
            setEnteredForward((prev) => ({
                card1: prev.card1 || currentStep === 1,
                card2: prev.card2 || currentStep === 2,
                card3: prev.card3 || currentStep === 3,
            }));
        }
        prevStepRef.current = currentStep;
    }, [currentStep]);

    useEffect(() => {
        if (isReplay) return;

        registerSlideStepHandler({
            onNext: () => {
                if (stepRef.current < 3) {
                    const nextStep = stepRef.current + 1;
                    stepRef.current = nextStep;
                    setLocalStep(nextStep);
                    return true; // Consumato: non cambia slide
                }
                return false; // Tutte le card sono visibili: avanza alla slide successiva
            },
            onPrev: () => {
                if (stepRef.current > 0) {
                    const prevStep = stepRef.current - 1;
                    stepRef.current = prevStep;
                    setLocalStep(prevStep);
                    return true; // Consumato: non cambia slide
                }
                return false; // Torna alla slide precedente
            },
            getCurrentStep: () => stepRef.current,
            getStepDescription: (s) =>
                s === 1
                    ? "Card 30 secondi per proporre la provocazione"
                    : s === 2
                        ? "Card 5 minuti per discutere"
                        : s === 3
                            ? "Card finiti i 5 minuti riparte il giro"
                            : "Nessuna card (inizio)",
        });

        return () => {
            registerSlideStepHandler(null);
        };
    }, [registerSlideStepHandler, isReplay]);

    const isCard1Visible = currentStep >= 1;
    const isCard2Visible = currentStep >= 2;
    const isCard3Visible = currentStep >= 3;

    const card1Class = isCard1Visible
        ? !isEnteredBackwards && enteredForward.card1 && currentStep === 1
            ? styles.card1Entrance
            : styles.card1Static
        : styles.card1Hidden;

    const card2Class = isCard2Visible
        ? !isEnteredBackwards && enteredForward.card2 && currentStep === 2
            ? styles.card2Entrance
            : styles.card2Static
        : styles.card2Hidden;

    const card3Class = isCard3Visible
        ? !isEnteredBackwards && enteredForward.card3 && currentStep === 3
            ? styles.card3Entrance
            : styles.card3Static
        : styles.card3Hidden;

    return (
        <ImageSlide
            imageName="fight-club.jpg"
            title="Fight club"
            className={styles.slideContainer}
        >
            {/* 1° Card: Sinistra - 30 secondi */}
            <div
                className={`${styles.ruleCard} ${styles.card1} ${card1Class}`}
                role="region"
                aria-label="Regola 1: 30 secondi per proporre la vostra provocazione"
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

            {/* 2° Card: Destra - 5 minuti */}
            <div
                className={`${styles.ruleCard} ${styles.card2} ${card2Class}`}
                role="region"
                aria-label="Regola 2: 5 minuti categorici per discutere sulla provocazione"
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

            {/* 3° Card: In basso al centro - Riparte il giro */}
            <div
                className={`${styles.ruleCard} ${styles.card3} ${card3Class}`}
                role="region"
                aria-label="Regola 3: E finiti i 5 minuti riparte il giro!"
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
