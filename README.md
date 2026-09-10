# Shiftati di Testa — Codemotion Presentation & Game App

Web application offline-first progettata per gestire talk interattivi dal vivo sul palco di Codemotion: proiettore 16:9 con stage scalato responsivamente, telecomando per presentazioni, modalità gioco ("Voglio fare un gioco con te") e countdown globale con trigger automatico "Stop alle telefonate".

---

## Indice

1. [Caratteristiche Principali](#caratteristiche-principali)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Comandi Disponibili](#comandi-disponibili)
4. [Come Cambiare il Base Path (GitHub Pages)](#come-cambiare-il-base-path-github-pages)
5. [Come Aggiungere una Nuova Slide](#come-aggiungere-una-nuova-slide)
6. [Come Aggiungere una Nuova Provocazione](#come-aggiungere-una-nuova-provocazione)
7. [Come Sostituire Token di Brand e Logo](#come-sostituire-token-di-brand-e-logo)
8. [Offline & PWA](#offline--pwa)

---

## 1. Caratteristiche Principali

- **Stage 16:9 nativo con auto-scaling (`1920×1080`)**: il contenuto viene renderizzato a dimensione fissa e scalato proporzionalmente con letterboxing su qualsiasi proiettore. Il chrome superiore (TopBar) resta fuori dallo stage e sempre nitido.
- **Navigazione da telecomando e tastiera**: supporta frecce (`ArrowRight`, `ArrowLeft`), barra spaziatrice (`Space`) e tasti `PageDown`/`PageUp` (i telecomandi da palco emulano PageDown/PageUp).
- **Countdown globale anti-drift**: calcolato sull'orario di fine talk rispetto al timestamp assoluto (`targetTimestamp - Date.now()`). Nessuna perdita di allineamento al refresh del browser o al cambio tab.
- **Overlay a schermo intero "Stop alle telefonate"**: allo scadere del tempo globale, su qualsiasi schermata comparsa, compare una volta sola un overlay monumentale che, al click di "Prosegui", porta alla slide configurata (slide 3, zero-based).
- **Modalità Gioco a State Machine pura**:
  - **IDLE (Step 1)**: schermata centrale in stile Saw con tasto Play.
  - **Eccezione 1° loop**: alla prima esecuzione il tasto Play porta direttamente alla prima provocazione (Step 2A).
  - **CHALLENGE (Step 2)**: timer 30 secondi con tasto "Accetta provocazione" o timeout verso lo Step 2A.
  - **PROVOCATION (Step 2A)**: mostra la provocazione con opzioni "Accetta" (-> discussione) o "Cambia provocazione" (scarta e passa alla successiva).
  - **DISCUSSION (Step 3)**: countdown 5 minuti a tutto schermo con tasto "Pausa/Riprendi" e "Prossima provocazione". Allo scadere (00:00) resta in stato allarme e non avanza senza conferma dello speaker.
- **Persistenza su `localStorage` versionata**: config, indice slide, sessione e stato del gioco persistono tra refresh o cambi di modalità.
- **Screen Wake Lock**: impedisce lo spegnimento o lo stand-by dello schermo durante la presentazione.

---

## 2. Stack Tecnologico

- **React 19** + **TypeScript** (`strict: true`, zero `any`).
- **Vite 6** con `@vitejs/plugin-react`.
- **`HashRouter`** (`react-router-dom`) per totale compatibilità con GitHub Pages e Service Worker offline.
- **SCSS con CSS Modules** (`*.module.scss`) e `@layer` (reset, tokens, components).
- **Font self-hosted WOFF2**: IBM Plex Sans, IBM Plex Mono e Roboto in `public/fonts/` (nessuna dipendenza da Google Fonts o CDN a runtime).
- **Service Worker e PWA scritti a mano**: precaching, cache-first per asset con hash, network-first per navigazioni.

---

## 3. Comandi Disponibili

```bash
# Installa le dipendenze
npm install

# Avvia il dev server locale
npm run dev

# Esegui il type check e compila il bundle di produzione
npm run build

# Anteprima locale del bundle di produzione (dist)
npm run preview
```

---

## 4. Come Cambiare il Base Path (GitHub Pages)

Nel file `vite.config.ts`, la costante `REPO_BASE` definisce il path base per GitHub Pages:

```ts
// vite.config.ts
export const REPO_BASE = "/provocazioni-shiftate-codemotion-antigravity/";
```

- Se fai il deploy su un repository con nome diverso, cambia la stringa con `"/<nuovo-repo>/"`.
- Se fai il deploy su un dominio personalizzato (es. `talk.codemotion.com`), imposta `REPO_BASE = "/"`.

---

## 5. Come Aggiungere una Nuova Slide

1. Crea il componente della slide in `src/features/presentation/slides/`, ad esempio `Slide06.tsx`:
   ```tsx
   import type { FC } from "react";
   import { TitleContentSlide } from "../layouts/TitleContentSlide";

   export const Slide06: FC = () => {
     return (
       <TitleContentSlide
         eyebrow="Nuova Sezione"
         title="Titolo della mia nuova slide"
         bullets={[
           "Primo punto saliente",
           "Secondo punto saliente",
         ]}
       />
     );
   };
   ```

2. Registra la slide in `src/features/presentation/slides.registry.ts`:
   ```ts
   import { Slide06 } from "./slides/Slide06";

   export const SLIDES: readonly SlideDefinition[] = [
     // ... altre slide
     { id: "nuova-slide", title: "Titolo", component: Slide06 },
   ];
   ```

3. I layout riutilizzabili disponibili in `src/features/presentation/layouts/` sono:
   - `TitleSlide`: slide introduttiva d'impatto con badge speaker.
   - `TitleContentSlide`: titolo grande ed elenco di punti con marker arancione.
   - `SplitSlide`: layout a due colonne per confronti o schemi contrapposti.
   - `FullBleedSlide`: citazione o statement centrale gigantesco a schermo pieno.
   - `ClosingSlide`: ringraziamenti finali con QR code e contatti.

---

## 6. Come Aggiungere una Nuova Provocazione

1. Crea il file della provocazione in `src/features/game/provocations/`, ad esempio `Provocation07.tsx`:
   ```tsx
   import type { FC } from "react";
   import styles from "./ProvocationCard.module.scss";

   export const Provocation07: FC = () => {
     return (
       <div className={styles.provocationCard}>
         <div className={styles.category}>
           <span>⚡ Provocazione #07 — Backend</span>
         </div>
         <div className={styles.contentWrapper}>
           <h2 className={styles.title}>
             La tua provocazione <span className={styles.highlight}>qui</span>.
           </h2>
           <p className={styles.subtitle}>
             Descrizione o battuta di approfondimento.
           </p>
         </div>
       </div>
     );
   };
   ```

2. Registra la provocazione in `src/features/game/provocations.registry.ts`:
   ```ts
   import { Provocation07 } from "./provocations/Provocation07";

   export const PROVOCATIONS: readonly ProvocationDefinition[] = [
     // ...
     {
       id: "mia-provocazione",
       title: "Titolo breve per la lista",
       component: Provocation07,
     },
   ];
   ```

---

## 7. Come Sostituire Token di Brand e Logo

### Palette Colori
I tre colori ufficiali del brand Codemotion sono definiti **esclusivamente** in `src/styles/_tokens.scss`:

```scss
/* Brand ufficiale — unico punto di modifica */
--color-brand-orange: #ff5c00;
--color-brand-navy: #0e1e30;
--color-brand-white: #ffffff;
```
Tutti gli altri colori semantici (`--color-surface`, `--color-text-muted`, `--color-accent`, `--color-border`) sono derivati automaticamente tramite `color-mix()`.

### Loghi
I loghi mostrati nella barra superiore e nella home page sono definiti in un unico componente:
`src/components/layout/LogoPlaceholder.tsx`.
Puoi sostituire i markup SVG con i file SVG definitivi o immagini PNG con totale flessibilità.

---

## 8. Offline & PWA

- Tutti i font (IBM Plex Sans, IBM Plex Mono, Roboto) sono archiviati in formato `.woff2` in `public/fonts/`.
- Il Service Worker in `public/sw.js` effettua il precache completo di font, shell HTML, manifest e icone.
- L'app non effettua alcuna chiamata a CDN esterni a runtime.
- Su proiettori con browser offline o disconnesso, l'app continuerà a funzionare senza interruzioni.
