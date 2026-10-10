# Shiftati di Testa — Codemotion Presentation, Game & Analytics App

Web application offline-first progettata per gestire talk interattivi dal vivo sul palco di **Codemotion**: stage 16:9 con auto-scaling nativo (`1920×1080`), navigazione per telecomando da palco e tastiera, countdown globale bifase anti-drift, modalità gioco Klippy Saw ("Voglio fare un gioco con te"), overlay automatico "Stop alle telefonate", tema dinamico Dark/Light in stile Neo-Brutalist e una suite completa di **Dashboard Analytics** per il monitoraggio e l'analisi dei tempi di ogni sessione.

---

## Indice

1. [Caratteristiche Principali](#1-caratteristiche-principali)
2. [Flusso del Talk & Gestione Sessione](#2-flusso-del-talk--gestione-sessione)
3. [Modalità Gioco: "Voglio fare un gioco con te" (Klippy Saw)](#3-modalità-gioco-voglio-fare-un-gioco-con-te-klippy-saw)
4. [Dashboard Analytics & Monitoraggio Sessioni](#4-dashboard-analytics--monitoraggio-sessioni)
5. [Controlli da Tastiera e Telecomando](#5-controlli-da-tastiera-e-telecomando)
6. [Design System: Neo-Brutalism & Temi (Dark & Light)](#6-design-system-neo-brutalism--temi-dark--light)
7. [Stack Tecnologico](#7-stack-tecnologico)
8. [Comandi Disponibili](#8-comandi-disponibili)
9. [Come Cambiare il Base Path (GitHub Pages)](#9-come-cambiare-il-base-path-github-pages)
10. [Come Aggiungere una Nuova Slide](#10-come-aggiungere-una-nuova-slide)
11. [Come Aggiungere una Nuova Provocazione](#11-come-aggiungere-una-nuova-provocazione)
12. [Come Personalizzare Token di Brand e Logo](#12-come-personalizzare-token-di-brand-e-logo)
13. [Offline & PWA](#13-offline--pwa)

---

## 1. Caratteristiche Principali

- **Stage 16:9 nativo con auto-scaling (`1920×1080`)**: il contenuto delle slide e del gioco viene renderizzato a dimensione fissa e scalato proporzionalmente con letterboxing su qualsiasi proiettore o monitor.
- **TopBar collassabile con scorciatoia (`H`) e persistenza**: la barra superiore può essere nascosta premendo il tasto `H` o `Escape` per un palco privo di distrazioni. Uno snello trigger discreto a comparsa permette di riaprirla in qualsiasi momento. Lo stato compresso/espanso è salvato in `localStorage`.
- **Countdown globale bifase anti-drift**:
  - *Fase 1 (Gioco)*: mostra i minuti rimanenti prima della conclusione del gioco (`endTimestamp - conclusionMinutes`).
  - *Fase 2 (Talk)*: dopo l'attivazione di "Stop alle telefonate", il countdown passa automaticamente al tempo residuo per la fine assoluta del talk.
  - Nessuna perdita di sincronizzazione al refresh del browser, al cambio di tab o alla sospensione del computer.
- **Overlay a schermo intero "Stop alle telefonate"**: allo scadere della finestra di gioco, scatta un overlay a tutto schermo con grafica personalizzata. Confermando ("Prosegui" o tasti `Enter`/`Space`/`Freccia Destra`), l'app riposiziona la presentazione direttamente sulle slide della conclusione.
- **Transizione automatica Slide → Gioco (Slide 11)**: alla slide configurata come fine introduzione (`introEndSlide`, default slide 11), premendo il tasto "Avanti" da telecomando si entra direttamente nella modalità Gioco Klippy Saw.
- **Conclusione del Talk e salvataggio metriche (Slide 14)**: sull'ultima slide è presente il controllo dedicato per archiviare la sessione, calcolare tutte le metriche e aprire la dashboard Analytics.
- **Suite Analytics completa (`/analytics`)**: tracciamento automatico di tempi per slide, tempi di decisione e discussione delle provocazioni, KPI aggregati, grafici dettagliati, timeline, viste tabellari, comparazione multi-sessione e import/export JSON.
- **Doppio Tema Dark / Light**: interfaccia con estetica Neo-Brutalist (bordi marcati, ombre nette sfalsate, alto contrasto visivo), commutabile dal pannello di configurazione.
- **Screen Wake Lock**: impedisce lo spegnimento o lo stand-by dello schermo durante la presentazione sul palco.

---

## 2. Flusso del Talk & Gestione Sessione

L'applicazione supporta il ciclo di vita completo del talk:

```
[Pannello Configurazione]
        │  (Imposta orario fine, minuti conclusione, slide transizione, tema)
        ▼
 [Fase 1: Introduzione] (Slide 1 → Slide 11)
        │
        ├─► [Telecomando Avanti su Slide 11] ──┐
        ▼                                      ▼
 [Fase 2: Gioco Klippy Saw] ◄──────────────────┘
        │  (IDLE -> CHALLENGE -> PROVOCATION -> DISCUSSION)
        ▼
 [Fase 3: Stop alle telefonate] (Trigger automatico a -conclusionMinutes)
        │  (Click "Prosegui" o tasto Avanti)
        ▼
 [Fase 4: Conclusione] (Slide 12 → Slide 14)
        │  (Takeaway, selfie finale e ringraziamenti)
        ▼
 [Fase 5: Fine Talk & Analytics] (/analytics)
           (Analisi tempi, grafici, esportazione report JSON)
```

### Parametri di Configurazione (`/`)
- **Orario di fine talk (`HH:MM`)**: orario target assoluto per la conclusione dell'intervento. Include validazione degli orari passati con richiesta di conferma.
- **Minuti di conclusione (`conclusionMinutes`, default 5 min)**: anticipo rispetto alla fine del talk in cui deve scattare l'overlay "Stop alle telefonate".
- **Slide fine introduzione (`introEndSlide`, default 11)**: numero della slide che attiva il passaggio automatico alla modalità Gioco tramite telecomando.
- **Tema dell'app**: selezione tra modalità Scura (`dark`) e Chiara (`light`).

---

## 3. Modalità Gioco: "Voglio fare un gioco con te" (Klippy Saw)

La modalità gioco è gestita da una State Machine pura che governa le quattro fasi:

1. **IDLE (Step 1 — Schermata Saw)**:
   - Mostra Klippy Saw a tutto schermo con il pulsante gigante **"Inizia il gioco"**.
   - Può essere avviato sia con click che premendo il tasto "Avanti" (`ArrowRight`, `Space`, `PageDown`).
   - Premendo il tasto "Indietro" (`ArrowLeft`, `PageUp`) si torna immediatamente alle slide.
2. **Eccezione 1° Loop**:
   - Alla prima esecuzione del gioco, il timer di sfida viene saltato e si passa direttamente alla prima provocazione (Step 2A).
3. **CHALLENGE (Step 2 — Sfida 30 secondi)**:
   - Countdown di 30 secondi per stimolare l'interazione del pubblico.
   - Indicatori visivi di allerta (warning a 20s, danger a 10s).
   - Pulsanti: **"Accetta Provocazione"** (avvia la discussione) oppure **"Salta"** (timeout/scarta).
4. **PROVOCATION (Step 2A — Scheda della provocazione)**:
   - Mostra il titolo, la categoria e il sottotitolo della provocazione estratta.
   - **"Cambia provocazione"**: scarta la provocazione corrente e ne estrae una nuova dal pool disponibile.
   - **"Accetta provocazione"**: conferma l'argomento e passa alla fase di discussione.
5. **DISCUSSION (Step 3 — Countdown 5 minuti)**:
   - Timer da 5:00 minuti visibile sul palco per moderare la discussione.
   - Pulsante **"Pausa / Riprendi"**: permette di congelare temporaneamente il timer (es. per una domanda lunga dal pubblico).
   - Pulsante **"Prossima provocazione"**: conclude la discussione e torna allo step di sfida successivo.
6. **Riciclo Automatico del Pool**:
   - Traccia le provocazioni discusse e quelle saltate.
   - Qualora tutte le provocazioni disponibili venissero esaurite, il pool viene resettato automaticamente senza interrompere il talk.

---

## 4. Dashboard Analytics & Monitoraggio Sessioni

Accessibile dal percorso `/analytics` o cliccando l'icona del grafico nella TopBar. Registra automaticamente e con precisione al secondo tutte le metriche della sessione attiva e mantiene lo storico di tutte le sessioni precedenti in `localStorage`.

### Metriche e Visualizzazioni
- **KPI Stats Cards**:
  - Durata totale effettiva del talk vs orario pianificato.
  - Tempo complessivo speso sulle slide vs tempo in modalità gioco.
  - Numero totale di provocazioni discusse, accettate e scartate.
  - Tempo medio di permanenza per slide e tempo medio di discussione per provocazione.
- **Slide Duration Chart**:
  - Grafico a barre con la durata esatta trascorsa su ciascuna slide (dalla 1 alla 14).
  - Benchmark visivo con la linea di durata media per slide.
  - Contatore del numero di visite/ritorni per ciascuna slide.
- **Provocations Chart**:
  - Visualizzazione dettagliata per ciascuna provocazione affrontata: tempo impiegato per accettarla vs durata effettiva della discussione.
- **Session Duration & Timeline Chart**:
  - Andamento cronologico cumulativo della sessione per verificare il rispetto della scaletta temporale.
- **Talk Distribution Chart**:
  - Distribuzione percentuale del tempo del talk tra le tre macro-aree: *Slide Introduzione*, *Gioco & Provocazioni*, *Slide Conclusione*.
- **Multi-Session Comparison Chart**:
  - Confronto visivo tra talk e prove differenti per analizzare l'evoluzione dei tempi, la velocità di esposizione e il numero di provocazioni completate.

### Strumenti di Gestione Dati
- **Vista Tabelle**: visualizzazione alternativa tabellare di slide e provocazioni con possibilità di cancellazione o modifica puntuale.
- **Modifica Sessione (`SessionEditorModal`)**: per aggiornare il nome della sessione (es. "Codemotion Talk Ufficiale") e aggiungere note descrittive.
- **Modifica Provocazione (`ProvocationEditorModal`)**: per correggere o perfezionare titoli e durate delle singole provocazioni registrate.
- **Esportazione JSON**: esporta la singola sessione o l'intero archivio storico in file `.json`.
- **Importazione JSON (`JsonImportModal`)**: carica sessioni salvate o condivise da altri dispositivi con validazione integrata.
- **Copia negli Appunti**: copia istantanea del JSON della sessione per incollarla in note o report.
- **Dataset Dimostrativo**: pulsante "Carica dati di esempio" per testare immediatamente grafici e KPI anche senza aver svolto un talk dal vivo.

---

## 5. Controlli da Tastiera e Telecomando

Tutti i comandi sono pensati per essere utilizzati alla cieca da telecomando per presentazioni sul palco:

| Tasto | Contesto | Azione |
| :--- | :--- | :--- |
| `ArrowRight` / `Space` / `PageDown` | Presentazione (Slide normali) | Slide successiva |
| `ArrowRight` / `Space` / `PageDown` | Slide Fine Intro (Slide 11) | **Attiva la Modalità Gioco (Klippy Saw)** |
| `ArrowRight` / `Space` / `PageDown` | Gioco (Schermata Saw / IDLE) | **Inizia il Gioco** |
| `ArrowRight` / `Space` / `Enter` | Overlay "Stop alle telefonate" | **Chiude l'overlay e torna alle slide di conclusione** |
| `ArrowLeft` / `PageUp` | Presentazione | Slide precedente |
| `ArrowLeft` / `PageUp` | Gioco (Schermata Saw / IDLE) | **Ritorna alla presentazione slide** |
| `H` | Qualsiasi schermata (tranne home) | **Mostra / Nascondi la barra superiore (TopBar)** |
| `Escape` | Qualsiasi schermata | Nasconde la barra superiore (se espansa) |
| Click su pulsante a schermo `Avanti` | Slide Fine Intro (Slide 11) | Avanza alla Slide 12 (senza entrare nel gioco) |
| Click su icona `Concludi Sessione` | Ultima Slide (Slide 14) | **Termina la sessione e apre la dashboard Analytics** |

---

## 6. Design System: Neo-Brutalism & Temi (Dark & Light)

L'applicazione adotta un design system **Neo-Brutalist** progettato per garantire massima leggibilità da grande distanza su proiettori di sala:
- **Bordi marcati e netti**: contorni neri ad alto contrasto (`border: 2px solid var(--color-border)`).
- **Ombre sfalsate (Offset Box Shadows)**: ombre piene e decise (`box-shadow: 4px 4px 0 var(--color-shadow)`), con animazione tattile `:active` a traslazione.
- **Tipografia premium self-hosted**: `IBM Plex Sans` per il testo, `IBM Plex Mono` per codici e timer, `Roboto` per le intestazioni.
- **Supporto Temi**:
  - `dark` (default): ideale per schermi di sala e palchi con illuminazione soffusa.
  - `light`: contrasto su base bianca con sfumature blu/arancione ad elevata brillantezza.
  - I temi si applicano tramite `data-theme="dark"` / `data-theme="light"` e aggiornano dinamicamente il `<meta name="theme-color">`.

---

## 7. Stack Tecnologico

- **React 19** + **TypeScript** (`strict: true`, zero `any`).
- **Vite 6** con `@vitejs/plugin-react`.
- **`HashRouter`** (`react-router-dom` v7) per totale compatibilità con GitHub Pages e Service Worker offline.
- **SCSS con CSS Modules** (`*.module.scss`) e `@layer` (reset, tokens, components).
- **Font self-hosted WOFF2**: IBM Plex Sans, IBM Plex Mono e Roboto in `public/fonts/` (nessuna dipendenza runtime da Google Fonts o CDN).
- **Service Worker e PWA scritti a mano**: precaching completo di asset, manifest e font.
- **SVG Vector Graphics native**: nessun set di icone esterno; icone personalizzate scalabili e leggere.

---

## 8. Comandi Disponibili

```bash
# Installa le dipendenze
npm install

# Avvia il dev server locale
npm run dev

# Esegui il type check con TypeScript e compila il bundle di produzione
npm run build

# Anteprima locale del bundle di produzione compilato (dist)
npm run preview
```

---

## 9. Come Cambiare il Base Path (GitHub Pages)

Nel file `vite.config.ts`, la costante `REPO_BASE` definisce il path base per GitHub Pages:

```ts
// vite.config.ts
export const REPO_BASE = "/provocazioni-shiftate-codemotion-antigravity/";
```

- Se effettui il deploy su un repository con nome diverso, modifica la stringa con `"/<nuovo-repo>/"`.
- Se effettui il deploy su un dominio personalizzato (es. `talk.codemotion.com`), imposta `REPO_BASE = "/"`.

---

## 10. Come Aggiungere una Nuova Slide

1. Crea il componente della slide in `src/features/presentation/slides/`, ad esempio `Slide15.tsx`:
   ```tsx
   import type { FC } from "react";
   import { TitleContentSlide } from "../layouts/TitleContentSlide";

   export const Slide15: FC = () => {
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
   import { Slide15 } from "./slides/Slide15";

   export const SLIDES: readonly SlideDefinition[] = [
     // ... altre slide
     { id: "nuova-slide", title: "15. Titolo", component: Slide15 },
   ];
   ```

3. I layout riutilizzabili disponibili in `src/features/presentation/layouts/` sono:
   - `TitleSlide`: slide introduttiva d'impatto con badge speaker.
   - `TitleContentSlide`: titolo grande ed elenco di punti con marker arancione.
   - `SplitSlide`: layout a due colonne per confronti o schemi contrapposti.
   - `FullBleedSlide`: citazione o statement centrale gigantesco a schermo pieno.
   - `ClosingSlide`: ringraziamenti finali con QR code e contatti.

---

## 11. Come Aggiungere una Nuova Provocazione

1. Crea il file della provocazione in `src/features/game/provocations/`, ad esempio `Provocation10.tsx`:
   ```tsx
   import type { FC } from "react";
   import styles from "./ProvocationCard.module.scss";

   export const Provocation10: FC = () => {
     return (
       <div className={styles.provocationCard}>
         <div className={styles.category}>
           <span>⚡ Provocazione #10 — Cloud</span>
         </div>
         <div className={styles.contentWrapper}>
           <h2 className={styles.title}>
             Il Cloud pubblico <span className={styles.highlight}>costerà troppo</span>.
           </h2>
           <p className={styles.subtitle}>
             Il grande ritorno dell'on-premise e dei server dedicati.
           </p>
         </div>
       </div>
     );
   };
   ```

2. Registra la provocazione in `src/features/game/provocations.registry.ts`:
   ```ts
   import { Provocation10 } from "./provocations/Provocation10";

   export const PROVOCATIONS: readonly ProvocationDefinition[] = [
     // ...
     {
       id: "cloud-on-prem",
       title: "Il Cloud pubblico costerà troppo",
       subtitle: "Il grande ritorno dell'on-premise e dei server dedicati",
       component: Provocation10,
     },
   ];
   ```

---

## 12. Come Personalizzare Token di Brand e Logo

### Palette Colori
I colori ufficiali del brand Codemotion sono definiti in `src/styles/_tokens.scss` (Dark mode) e `src/styles/_tokens_light.scss` (Light mode):

```scss
/* Brand ufficiale */
--color-brand-orange: #ff5c00;
--color-brand-navy: #0e1e30;
--color-brand-white: #ffffff;
```
Tutti i colori semantici (`--color-surface`, `--color-text-muted`, `--color-accent`, `--color-border`) sono derivati in modo armonioso con contrasti verificati.

### Loghi
I loghi mostrati nella barra superiore e nella schermata iniziale sono gestiti centralmente in:
[LogoPlaceholder.tsx](file:///Users/daniel/Projects/github/provocazioni-shiftate-antigravity/src/components/layout/LogoPlaceholder.tsx).
Puoi sostituire i vettori SVG con nuove icone o file immagine preservando l'allineamento.

---

## 13. Offline & PWA

- **Font WOFF2 locali**: tutti i font (IBM Plex Sans, IBM Plex Mono, Roboto) sono archiviati localmente in `public/fonts/`.
- **Service Worker (`public/sw.js`)**: precache automatico degli asset compilati, della shell HTML, delle immagini e del manifest.
- **Nessuna dipendenza runtime esterna**: l'app funziona regolarmente in modalità aereo o con Wi-Fi di sala instabile.
