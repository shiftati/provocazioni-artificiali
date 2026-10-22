# Shiftati di Testa al Codemotion Milano del 28-29 Ottobre 2026 (Presentazione e Gioco)

Web application offline-first progettata per gestire talk interattivi dal vivo sul palco di **Codemotion**: stage 16:9 con auto-scaling nativo (`1920×1080`), navigazione per telecomando da palco e tastiera, countdown globale bifase anti-drift, modalità gioco Klippy Saw ("Voglio fare un gioco con te"), overlay automatico "Stop alle telefonate", tema dinamico Dark/Light in stile Neo-Brutalist, suite completa di **Dashboard Analytics**, pacchetti di **Export/Import ZIP con audio** e motore di **Session Replay** con sincronizzazione audio per rivivere ogni secondo del talk.

---

## Indice

1. [Caratteristiche Principali](#1-caratteristiche-principali)
2. [Flusso del Talk & Gestione Sessione](#2-flusso-del-talk--gestione-sessione)
3. [Modalità Gioco: "Voglio fare un gioco con te" (Klippy Saw)](#3-modalità-gioco-voglio-fare-un-gioco-con-te-klippy-saw)
4. [Dashboard Analytics & Monitoraggio Sessioni](#4-dashboard-analytics--monitoraggio-sessioni)
5. [Session Replay & Sincronizzazione Audio (`/replay`)](#5-session-replay--sincronizzazione-audio-replay)
6. [Controlli da Tastiera e Telecomando](#6-controlli-da-tastiera-e-telecomando)
7. [Design System: Neo-Brutalism & Temi (Dark & Light)](#7-design-system-neo-brutalism--temi-dark--light)
8. [Stack Tecnologico](#8-stack-tecnologico)
9. [Comandi Disponibili](#9-comandi-disponibili)
10. [Base Path e Dominio Personalizzato (`codemotion.shiftati.it`)](#10-base-path-e-dominio-personalizzato-codemotionshiftatiit)
11. [Come Aggiungere una Nuova Slide](#11-come-aggiungere-una-nuova-slide)
12. [Come Aggiungere una Nuova Provocazione](#12-come-aggiungere-una-nuova-provocazione)
13. [Come Personalizzare Token di Brand e Logo](#13-come-personalizzare-token-di-brand-e-logo)
14. [Offline, PWA & Gestione Cache](#14-offline-pwa--gestione-cache)

---

## 1. Caratteristiche Principali

- **Stage 16:9 nativo con auto-scaling (`1920×1080`)**: il contenuto delle slide e del gioco viene renderizzato a dimensione fissa e scalato proporzionalmente con letterboxing su qualsiasi proiettore o monitor.
- **TopBar collassabile con scorciatoia (`H`) e persistenza**: la barra superiore può essere nascosta premendo il tasto `H` o `Escape` per un palco privo di distrazioni. Uno snello trigger discreto a comparsa permette di riaprirla in qualsiasi momento. Lo stato compresso/espanso è salvato in `localStorage`.
- **Countdown globale bifase anti-drift**:
  - *Fase 1 (Gioco)*: mostra i minuti rimanenti prima della conclusione del gioco (`endTimestamp - conclusionMinutes`).
  - *Fase 2 (Talk)*: dopo l'attivazione di "Stop alle telefonate", il countdown passa automaticamente al tempo residuo per la fine assoluta del talk (proseguendo in negativo oltre lo zero finché il talk non viene concluso).
  - Nessuna perdita di sincronizzazione al refresh del browser, al cambio di tab o alla sospensione del computer.
- **Overlay a schermo intero "Stop alle telefonate"**: allo scadere della finestra di gioco, scatta un overlay a tutto schermo con grafica personalizzata. Confermando ("Prosegui" o tasti `Enter`/`Space`/`Freccia Destra`), l'app riposiziona la presentazione direttamente sulle slide della conclusione.
- **Transizione automatica Slide → Gioco**: alla slide configurata come fine introduzione (`introEndSlide`, default slide 10), premendo il tasto "Avanti" da telecomando o tastiera si entra direttamente nella modalità Gioco Klippy Saw.
- **Animazioni interne a step**: supporto nativo per avanzamento a step sequenziali su slide complesse prima di passare alla slide successiva (es. Slide 5 `Daniel e Ste`, Slide 8 `Fight Club` con comparsa progressiva delle tre regole del gioco, Slide 13 `Finale`).
- **Slide Schermo Nero (Blackout Slide #14)**: slide finale completamente nera per chiudere elegantemente l'intervento o mettere in standby il videoproiettore senza mostrare l'interfaccia o il desktop del computer.
- **Reset Rapido di Slide e Gioco**: comando dedicato nel pannello di configurazione con modale di conferma per azzerare lo stato corrente del talk (riportando la slide al Titolo #1 e il gioco allo stato IDLE) senza intaccare i dati del countdown né lo storico delle sessioni.
- **Test Microfono dal Vivo & VU Meter**: strumento interattivo in tempo reale con indicatore di livello audio percentuale per collaudare il microfono di sala prima di avviare il talk.
- **Posizione Frecce di Navigazione Configurabile**: possibilità di scegliere tra frecce grandi sovrapposte allo stage ("Sopra la slide") o pulsanti compatti integrati nella TopBar ("Nell'intestazione").
- **Suite Analytics completa (`/analytics`)**: tracciamento automatico di tempi per slide, tempi di decisione e discussione delle provocazioni, KPI aggregati, grafici dettagliati, timeline interattiva, viste tabellari, comparazione multi-sessione e player vocale.
- **Pacchetti ZIP con Audio & Import Universale**: esportazione di sessioni singole o massive in formato archivio `.zip` compresso contenente `session.json` e la registrazione vocale salvata in locale (`IndexedDB`). Importazione universale drag & drop sia di file `.json` sia di archivi `.zip`.
- **Modal dedicato Importazione & Associazione Audio (`AudioImportModal`)**: carica tracce audio esterne (`.webm`, `.mp3`, `.wav`, `.m4a`, `.ogg`, `.aac`, `.zip`), ascolta l'anteprima con calcolo automatico della durata e associala a qualsiasi sessione talk in `IndexedDB`.
- **Session Replay ad alta fedeltà con Audio Sync (`/replay`)**: motore di riproduzione fotogramma per fotogramma per rivedere l'intero talk (slide, animazioni interne a step, fasi del gioco e overlay) sincronizzato all'audio vocale registrato tramite microfono.
- **Doppio Tema Dark / Light**: interfaccia con estetica Neo-Brutalist (bordi marcati, ombre nette sfalsate, alto contrasto visivo), commutabile dal pannello di configurazione.
- **PWA Offline-First & Screen Wake Lock**: precache completo di tutte le immagini e asset con indicatore visivo di stato cache offline (0-100%) e blocco automatico dello stand-by dello schermo durante la presentazione.

---

## 2. Flusso del Talk & Gestione Sessione

L'applicazione supporta il ciclo di vita completo del talk:

```
[Pannello Configurazione (/)]
        │  (Orario fine talk, minuti conclusione, slide fine intro, test microfono, tema, reset)
        ▼
 [Fase 1: Introduzione] (Slide 1 → Slide 10)
        │
        ├─► [Telecomando Avanti su Slide Fine Intro (#10)] ──┐
        ▼                                                    ▼
 [Fase 2: Gioco Klippy Saw] ◄────────────────────────────────┘
        │  (IDLE -> CHALLENGE -> PROVOCATION -> DISCUSSION)
        ▼
 [Fase 3: Stop alle telefonate] (Trigger automatico a -conclusionMinutes)
        │  (Click "Prosegui" o tasto Avanti / Enter / Space)
        ▼
 [Fase 4: Conclusione] (Slide 11 → Slide 14)
        │  (Slide 11 Eccellenza, Slide 12 Selfie, Slide 13 Finale con QR, Slide 14 Schermo Nero)
        ▼
 [Fase 5: Fine Talk, Analytics & Replay] (/analytics e /replay)
           (Analisi tempi, grafici, ascolto audio, esportazione ZIP, replay sincronizzato)
```

### Parametri e Strumenti di Configurazione (`/`)

- **Orario di fine talk (`HH:MM`)**: orario target assoluto per la conclusione dell'intervento. Include validazione degli orari passati con richiesta esplicita di conferma.
- **Minuti di conclusione (`conclusionMinutes`, default 5 min)**: anticipo rispetto alla fine del talk in cui scatta l'overlay "Stop alle telefonate".
- **Slide fine introduzione (`introEndSlide`, default 10)**: numero della slide che attiva il passaggio automatico alla modalità Gioco tramite telecomando o tastiera (default: slide 10 "Klippy matrix / Documentazione insensata").
- **Posizione frecce di navigazione (`navOnSlide`)**:
  - *Sopra la slide*: frecce grandi sui lati dello stage per un controllo visivo immediato a schermo.
  - *Nell'intestazione*: frecce compatte nella TopBar per massimizzare la pulizia visiva delle slide.
- **Registrazione Audio Talk**:
  - Attiva/disattiva l'acquisizione del microfono per salvare la traccia vocale dell'intervento in locale (`IndexedDB`).
  - **Selezione Dispositivo Microfonico**: dropdown per scegliere una specifica sorgente microfonica tra quelle collegate al computer.
  - **Test Microfono & VU Meter**: pulsante "Testa Microfono" con barra dinamica del livello audio (0-100%) per verificare gain e qualità del segnale prima dell'evento.
  - **Indicatore Registrazione in Corso**: se il talk è attivo e l'audio è in acquisizione, mostra un banner con badge dedicato e pulsante "Ferma Registrazione" per terminare e archiviare la traccia audio senza chiudere il talk.
- **Tema dell'app**: selezione istantanea tra modalità Scura (`dark`, default) e Chiara (`light`).
- **Pulsante "Reset" Slide e Gioco**: apre un modale di sicurezza che imposta la slide corrente alla numero 1 (`Titolo`) e il gioco allo stato `IDLE` (`KlippySaw`), ideale per ripetere le prove senza azzerare l'orario impostato o eliminare i talk archiviati.
- **Monitoraggio Cache Offline & PWA**: visualizzazione in percentuale dei file salvati in cache (`cachePercent%`), badge "100% Offline" e pulsante per forzare la risincronizzazione completa di tutti gli asset statici e multimediali.

---

## 3. Modalità Gioco: "Voglio fare un gioco con te" (Klippy Saw)

La modalità gioco è governata da una State Machine pura a prova di freeze:

1. **IDLE (Step 1 — Schermata Saw)**:
   - Mostra Klippy Saw a tutto schermo con grafica neo-brutal e il pulsante **"Inizia il gioco"**.
   - Può essere avviato sia cliccando sullo stage sia premendo il tasto "Avanti" (`ArrowRight`, `Space`, `PageDown`).
   - Premendo il tasto "Indietro" (`ArrowLeft`, `PageUp`) si torna immediatamente alla presentazione slide.
2. **Eccezione 1° Loop**:
   - Alla prima esecuzione del gioco, il timer di sfida viene saltato e si passa direttamente alla prima provocazione (Step 2A).
3. **CHALLENGE (Step 2 — Sfida 30 secondi)**:
   - Countdown di 30 secondi con visual warning a 20s e danger a 10s per stimolare la decisione del pubblico.
   - Pulsanti con decal grafici e bordi ad alto contrasto: **"Accetta Provocazione"** (avvia la discussione) oppure **"Salta"** (scarta e pesca la successiva).
4. **PROVOCATION (Step 2A — Scheda della provocazione)**:
   - Renderizza la card della provocazione (`ProvocationCard`) con titolo tipografico evidenziato, sottotitolo e visual dedicato da `public/images/provocations/`.
   - **"Cambia provocazione"**: scarta la provocazione estratta e ne sorteggia una nuova dal pool rimasto.
   - **"Accetta provocazione"**: conferma l'argomento e passa al timer di discussione.
5. **DISCUSSION (Step 3 — Countdown 5 minuti)**:
   - Timer prominente da 5:00 minuti con soglie visive di warning (3 min) e danger (1 min).
   - Pulsante **"Pausa / Riprendi"**: congela il countdown in caso di interventi o domande articolate dal pubblico.
   - Pulsante **"Prossima provocazione"**: archivia il tempo discusso e torna allo step di sfida successivo.
6. **Riciclo Automatico del Pool**:
   - Tiene traccia delle provocazioni completate e di quelle scartate.
   - Qualora tutte le provocazioni disponibili venissero esaurite, il pool viene resettato automaticamente consentendo al talk di proseguire senza interruzioni.

---

## 4. Dashboard Analytics & Monitoraggio Sessioni

Accessibile dal percorso `/analytics` o cliccando l'icona del grafico nella TopBar. Registra automaticamente ogni secondo della sessione attiva e mantiene lo storico di tutti i talk precedenti in `localStorage` e `IndexedDB`.

### Metriche e Visualizzazioni
- **KPI Stats Cards**:
  - Durata totale effettiva del talk vs orario pianificato.
  - Tempo complessivo trascorso sulle slide vs tempo trascorso nel gioco.
  - Numero totale di provocazioni discusse, accettate e scartate.
  - Tempo medio di permanenza per slide e tempo medio di discussione per provocazione.
- **Slide Duration Chart**:
  - Grafico a barre con la durata esatta trascorsa su ciascuna slide (dalla 1 alla 14).
  - Linea di benchmark della durata media per slide.
  - Contatore del numero di visite e passaggi a ritroso per singola slide.
- **Provocations Chart**:
  - Tempo impiegato per decidere/accettare ciascuna provocazione vs durata effettiva della discussione.
- **Session Duration & Timeline Chart**:
  - Andamento cronologico cumulativo della sessione per verificare il ritmo espositivo rispetto alla scaletta.
- **Talk Distribution Chart**:
  - Distribuzione percentuale del tempo tra le macro-aree: *Slide Introduzione*, *Gioco & Provocazioni*, *Slide Conclusione*.
- **Multi-Session Comparison Chart**:
  - Confronto visivo multi-talk tra sessioni e prove differenti per analizzare l'evoluzione dei tempi e delle provocazioni affrontate.
- **Session Timeline Interattiva**:
  - Cronistoria dettagliata di ogni singolo evento (slide, step di animazione, cambi di stato gioco, pause, stop telefonate).
  - Pulsante dedicato **"Rivedi da qui"** per saltare istantaneamente al secondo esatto nel Session Replay.
- **Talk Audio Player (`TalkAudioPlayer`)**:
  - Player audio avanzato per ascoltare la traccia vocale memorizzata in IndexedDB.
  - Pulsante per lanciare il **Session Replay sincronizzato** direttamente dall'offset audio corrente.
  - Pulsante **Scarica Audio**: scarica il file audio registrato in locale (`downloadAudioFile`).
  - Pulsante **Elimina Audio**: rimuove la traccia da IndexedDB liberando memoria browser.

### Strumenti di Gestione Dati ed Esportazione
- **Esportazione ZIP Completa (con traccia audio)**:
  - Esportando una sessione che dispone di registrazione vocale, l'app genera automaticamente un pacchetto `.zip` compresso contenente `session.json` e il file audio associato (`audio_<nome>.<ext>`).
  - Se la sessione non ha audio, effettua il fallback pulito esportando direttamente il file `.json`.
  - **Esporta Tutte (`Esporta tutte (N)`)**: genera un archivio ZIP globale con `sessions.json` e la sottocartella `audio/` con tutte le tracce vocali memorizzate.
- **Importazione Universale (`JsonImportModal`)**:
  - Supporta sia file `.json` tradizionali sia archivi `.zip`.
  - Estrae i record delle sessioni e salva automaticamente le tracce audio in `IndexedDB`, ripristinando integralmente replay e player.
- **Importazione ed Associazione Audio Dedicata (`AudioImportModal`)**:
  - Accessibile tramite il pulsante **"Importa Audio"**.
  - Permette di selezionare qualsiasi file audio esterno (formati: `.webm`, `.mp3`, `.wav`, `.m4a`, `.mp4`, `.ogg`, `.aac`, o da file ZIP).
  - Include un player di anteprima con **rilevamento automatico della durata audio** (`detectAudioDuration`).
  - Consente di scegliere la sessione di destinazione a cui collegare l'audio, salvandolo in `IndexedDB`.
- **Modifica Sessione (`SessionEditorModal`)**: per aggiornare titolo del talk e annotazioni esplicative.
- **Modifica Provocazione (`ProvocationEditorModal`)**: per correggere o perfezionare titoli e durate delle singole provocazioni registrate.
- **Copia negli Appunti**: copia rapida del JSON della sessione per incollaggio immediato.
- **Dataset Dimostrativo**: pulsante "Carica dati di esempio" per esplorare grafici e KPI anche senza una sessione dal vivo.

---

## 5. Session Replay & Sincronizzazione Audio (`/replay`)

Il componente [SessionReplayView.tsx](file:///Users/daniel/Projects/github/provocazioni-shiftate-antigravity/src/features/replay/SessionReplayView.tsx) implementa un motore ad alta fedeltà che ricostruisce il talk esattamente come è stato vissuto sul palco:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Stage 16:9 Nativo (Slide, Animazioni a Step, Gioco Klippy Saw, Overlay)│
│                                                                        │
│  [Traccia Audio IndexedDB] ◄────── Sincronizzazione Hardware ─────────►│
└────────────────────────────────────────────────────────────────────────┘
│  ReplayControlBar: Scrubber Timeline, Event Markers, Velocità (1x-30x) │
└────────────────────────────────────────────────────────────────────────┘
```

### Funzionalità Chiave del Replay

1. **Riproduzione Fedele dello Stage 16:9**:
   - Renderizza le slide con le stesse dimensioni e lo scaling del palco (`isReplay={true}`).
   - Supporto nativo per le **animazioni interne a step** (`SLIDE_ANIMATION` con tracking di `slideStep`), permettendo di rivedere le transizioni progressive su slide complesse:
     - Slide 5 `Daniel e Ste`: comparsa graduale degli avatar e di Klippy.
     - Slide 8 `Fight Club`: comparsa progressiva delle tre regole del talk (Regola 1, Regola 2, Regola 3).
     - Slide 13 `Finale`: comparsa sequenziale del treno e del QR code finale.
   - Ricostruisce tutti gli stati del gioco Klippy Saw (`IDLE`, `CHALLENGE`, `PROVOCATION`, `DISCUSSION` con pause e riprese) e gli overlay di sistema ("Stop alle telefonate!").
   - Interazione disattivata sullo stage (`pointerEvents: "none"`) per garantire la totale fedeltà ai dati registrati.

2. **Sincronizzazione Hardware Audio (Audio Clock Sync)**:
   - Se durante il talk è stata abilitata la registrazione vocale, la traccia audio viene caricata automaticamente da IndexedDB (`getAudioRecording`).
   - L'audio hardware clock (`audio.currentTime`) funge da **source of truth primaria** per la sincronizzazione: il rendering visivo e i timer seguono al millisecondo la traccia vocale.
   - In assenza di traccia audio, il motore passa in modo trasparente al clock delta basato su `requestAnimationFrame`.
   - **Seek Bidirezionale**: spostando la timeline o saltando agli eventi, la traccia audio e lo stage visivo si riposizionano istantaneamente all'unisono.
   - **Auto-Mute di Protezione**: il sonoro viene disattivato automaticamente a velocità elevate ($\ge$ 5x) per prevenire fastidiosi screeching audio, con possibilità di controllo manuale mute/unmute (`M`).

3. **Floating Dock di Controllo (`ReplayControlBar`)**:
   - Dock inferiore fluttuante con scomparsa automatica per inattività del mouse (dopo 4 secondi).
   - **Timeline Scrubber Continua**: barra di trascinamento temporale con percentuale di completamento e minutaggio trascorso / totale formattato (`MM:SS`).
   - **Marker Visivi degli Eventi**: indicatori colorati distribuiti lungo la timeline in base alla tipologia di evento (slide, gioco, stop alle telefonate); cliccando su un marker si salta immediatamente all'evento.
   - **Pill Informativa Dinamica**: mostra in tempo reale l'evento corrente con icona dedicata (🖼️ slide, ✨ animazione interna, 💡 provocazione, ⏱️ sfida, 💬 discussione, 🔔 stop alle telefonate).
   - **Selettore Velocità di Riproduzione**: pulsanti rapidi per riprodurre a `1x`, `2x`, `5x`, `10x` o `30x`.
   - **Navigazione Rapida per Eventi**: pulsanti per saltare istantaneamente all'evento precedente o successivo.

4. **Deep Linking & Avvio Mirato (`?startAt=epochMs`)**:
   - Supporto al parametro URL `?startAt=` per aprire il replay ad un timestamp specifico.
   - Integrato con i pulsanti "Rivedi da qui" della timeline in Analytics e con il player audio per passare con un click dall'analisi dei grafici alla revisione visiva.

5. **Retrocompatibilità e Arricchimento Sintetico degli Eventi**:
   - Le utility `ensureSessionEvents` ed `enrichSlideAnimationEvents` arricchiscono automaticamente sessioni legacy o prive di eventi di dettaglio, sintetizzando gli step di animazione e la sequenza delle slide per garantire una riproduzione fluida anche su dati storici.

---

## 6. Controlli da Tastiera e Telecomando

### Controlli Presentazione sul Palco (Telecomando & Tastiera)

| Tasto | Contesto | Azione |
| :--- | :--- | :--- |
| `ArrowRight` / `Space` / `PageDown` | Slide con animazioni (Step in sospeso) | **Attiva lo step di animazione successivo** (es. regola Fight Club, avatar) |
| `ArrowRight` / `Space` / `PageDown` | Presentazione (Slide normali) | Slide successiva |
| `ArrowRight` / `Space` / `PageDown` | Slide Fine Intro (default Slide 10) | **Attiva la Modalità Gioco (Klippy Saw)** |
| `ArrowRight` / `Space` / `PageDown` | Gioco (Schermata Saw / IDLE) | **Inizia il Gioco** |
| `ArrowRight` / `Space` / `Enter` | Overlay "Stop alle telefonate" | **Chiude l'overlay e torna alle slide di conclusione** |
| `ArrowLeft` / `PageUp` | Slide con animazioni (Step > 0) | **Torna allo step di animazione precedente** |
| `ArrowLeft` / `PageUp` | Presentazione | Slide precedente |
| `ArrowLeft` / `PageUp` | Gioco (Schermata Saw / IDLE) | **Ritorna alla presentazione slide** |
| `H` | Qualsiasi schermata (tranne home) | **Mostra / Nascondi la barra superiore (TopBar)** |
| `Escape` | Qualsiasi schermata | Nasconde la barra superiore (se espansa) |
| Click su pulsante a schermo `Avanti` | Slide Fine Intro (Slide 10) | Avanza alla Slide 11 (senza entrare nel gioco) |
| Click su icona `Concludi Sessione` | Ultima Slide (Slide 14) | **Termina la sessione e apre la dashboard Analytics** |

### Scorciatoie da Tastiera del Session Replay (`/replay`)

| Tasto | Azione Replay |
| :--- | :--- |
| `Space` | **Play / Pausa** |
| `Escape` | **Esci dal Replay** e ritorna alla schermata Analytics |
| `M` | **Attiva / Disattiva Audio** (Toggle Mute) |
| `ArrowLeft` | **Salto indietro di 5 secondi** |
| `ArrowRight` | **Salto avanti di 5 secondi** |
| `Shift + ArrowLeft` | **Salta all'evento precedente** |
| `Shift + ArrowRight` | **Salta all'evento successivo** |
| `1` | Imposta velocità di riproduzione a **1x** |
| `2` | Imposta velocità di riproduzione a **2x** |
| `3` | Imposta velocità di riproduzione a **5x** |
| `4` | Imposta velocità di riproduzione a **10x** |
| `5` | Imposta velocità di riproduzione a **30x** |

---

## 7. Design System: Neo-Brutalism & Temi (Dark & Light)

L'applicazione adotta un design system **Neo-Brutalist** progettato per garantire massima leggibilità da grande distanza su proiettori di sala:
- **Bordi marcati e netti**: contorni neri ad alto contrasto (`border: 2px solid var(--color-border)`).
- **Ombre sfalsate (Offset Box Shadows)**: ombre piene e decise (`box-shadow: 4px 4px 0 var(--color-shadow)`), con animazione tattile `:active` a traslazione.
- **Tipografia premium self-hosted**: `IBM Plex Sans` per il testo, `IBM Plex Mono` per codici e timer, `Roboto` per le intestazioni, `Alfa Slab One` per titoli d'impatto.
- **Palette Colori Ufficiali**:
  - Brand Orange: `#ff5500`
  - Brand Navy: `#071526`
  - Brand Mint: `#5ef2b8`
  - Brand Blue: `#1e66fa`
- **Supporto Temi**:
  - `dark` (default): ideale per schermi di sala e palchi con illuminazione soffusa.
  - `light`: contrasto su base bianca con sfumature blu/arancione ad elevata brillantezza.
  - I temi si applicano tramite `data-theme="dark"` / `data-theme="light"` e sincronizzano dinamicamente il tag `<meta name="theme-color">`.

---

## 8. Stack Tecnologico

- **React 19** + **TypeScript** (`strict: true`, zero `any`).
- **Vite 6** con `@vitejs/plugin-react` e `vite-plugin-pwa`.
- **`HashRouter`** (`react-router-dom` v7) per totale compatibilità con GitHub Pages e Service Worker offline.
- **SCSS con CSS Modules** (`*.module.scss`) e `@layer` (reset, tokens, components).
- **JSZip**: generazione ed estrazione client-side di archivi `.zip` per esportare e importare pacchetti talk con file audio.
- **Font self-hosted WOFF2**: IBM Plex Sans, IBM Plex Mono, Roboto e Alfa Slab One in `public/fonts/` (nessuna dipendenza runtime da CDN).
- **Archiviazione Locale & IndexedDB**: `localStorage` per configurazioni e record di sessione, `IndexedDB` nativo per memorizzare registrazioni audio vocali senza saturare lo storage di sistema.
- **Service Worker e PWA**: precaching completo di asset, immagini, manifest e font per esecuzione 100% offline.
- **SVG Vector Graphics native**: nessun set di icone esterno; icone personalizzate scalabili e leggere.

---

## 9. Comandi Disponibili

```bash
# Installa le dipendenze
pnpm install # oppure npm install

# Avvia il dev server locale
pnpm run dev # oppure npm run dev

# Esegui il type check con TypeScript e compila il bundle di produzione
pnpm run build # oppure npm run build

# Anteprima locale del bundle di produzione compilato (dist)
pnpm run preview # oppure npm run preview
```

---

## 10. Base Path e Dominio Personalizzato (`codemotion.shiftati.it`)

Nel file `vite.config.ts`, la costante `REPO_BASE` definisce il base path dell'applicazione:

```ts
// vite.config.ts
// Impostato a "/" per dominio personalizzato (es. codemotion.shiftati.it)
export const REPO_BASE = "/";
```

- **Dominio personalizzato**: per domini dedicati come `codemotion.shiftati.it` (gestito tramite file `public/CNAME`), `REPO_BASE` è impostato su `"/"`.
- **Sottocartella GitHub Pages**: se effettui il deploy su un repository GitHub standard senza CNAME (es. `https://<utente>.github.io/<repo>/`), imposta:
  ```ts
  export const REPO_BASE = "/<nome-repo>/";
  ```

---

## 11. Come Aggiungere una Nuova Slide

L'elenco attuale delle slide registrate in `src/features/presentation/slides.registry.ts` comprende 14 slide:
1. `Titolo` (Slide 1)
2. `GliEsperti` (Slide 2)
3. `SviluppatoreQualunque` (Slide 3)
4. `MacchinettaDelCaffe` (Slide 4)
5. `DanielESte` (Slide 5 — *Step animati*)
6. `RitornoAlFuturo` (Slide 6)
7. `KlippySaw` (Slide 7)
8. `FightClub` (Slide 8 — *Step animati per le 3 regole*)
9. `CybersicurezzaLottaTraAi` (Slide 9)
10. `DocumentazioneInsensata` (Slide 10 — *Slide di fine intro predefinita*)
11. `IoSonoEccellenza` (Slide 11)
12. `Selfie` (Slide 12)
13. `Finale` (Slide 13 — *Step animati per treno e QR code*)
14. `SchermoNero` (Slide 14 — *Blackout finale*)

### Procedura di Aggiunta:

1. Crea il componente della slide in `src/features/presentation/slides/`, ad esempio `NuovaSlide.tsx`:
   ```tsx
   import type { FC } from "react";
   import { ImageSlide } from "../layouts/ImageSlide";

   export const NuovaSlide: FC = () => {
     return (
       <ImageSlide
         imageName="mia-immagine.jpg"
         title="Titolo descrittivo"
       />
     );
   };
   ```

2. Registra la slide in `src/features/presentation/slides.registry.ts`:
   ```ts
   import { NuovaSlide } from "./slides/NuovaSlide";

   export const SLIDES: readonly SlideDefinition[] = [
     // ... altre slide
     {
       id: "nuova-slide",
       title: "Nuova Slide",
       component: NuovaSlide,
       transition: "fade-scale",
       transitionDurationMs: 600,
       assets: ["images/slides/mia-immagine.jpg"],
     },
   ];
   ```

3. I layout riutilizzabili disponibili in `src/features/presentation/layouts/` sono:
   - `ImageSlide`: layout standard per slide grafiche a tutto schermo con supporto a `useCachedAsset`.
   - `TitleSlide`: slide introduttiva d'impatto con badge speaker.
   - `TitleContentSlide`: titolo grande ed elenco di punti con marker arancione.
   - `SplitSlide`: layout a due colonne per confronti o schemi contrapposti.
   - `FullBleedSlide`: citazione o statement centrale gigantesco a schermo pieno.
   - `ClosingSlide`: ringraziamenti finali con QR code e contatti.

4. **Animazioni interne a step (opzionali)**: se la slide richiede passaggi sequenziali (come `FightClub` o `DanielESte`), usa il callback `registerSlideStepHandler` fornito da `useAppState()` per intercettare i tasti Avanti/Indietro del telecomando prima di consentire il passaggio alla slide successiva.

---

## 12. Come Aggiungere una Nuova Provocazione

Tutte le provocazioni utilizzano il componente base `ProvocationCard`, integrato con l'hook di caching offline `useCachedAsset` per garantire visualizzazione immediata anche in assenza di rete.

1. Salva l'immagine della provocazione in `public/images/provocations/` (es. `ia-developer.jpeg`).

2. Crea il componente in `src/features/game/provocations/`, ad esempio `IaDeveloper.tsx`:
   ```tsx
   import type { FC } from "react";
   import { ProvocationCard } from "./ProvocationCard";
   import styles from "./ProvocationCard.module.scss";

   export const IaDeveloper: FC = () => {
     return (
       <ProvocationCard
         imageName="ia-developer.jpeg"
         ariaLabel="Provocazione: L'IA sostituirà i developer"
       >
         <h2 className={styles.title}>
           <span>L'IA sostituirà</span>{" "}
           <span className={styles.highlight}>
             i junior developer
           </span>
         </h2>
       </ProvocationCard>
     );
   };
   ```

3. Registra la provocazione in `src/features/game/provocations.registry.ts`:
   ```ts
   import { IaDeveloper } from "./provocations/IaDeveloper";

   export const PROVOCATIONS: readonly ProvocationDefinition[] = [
     // ... altre provocazioni
     {
       id: "ia-developer",
       title: "L'IA sostituirà i junior developer",
       subtitle: "Automazione della scrittura del codice vs problem solving",
       component: IaDeveloper,
       image: "images/provocations/ia-developer.jpeg",
     },
   ];
   ```

---

## 13. Come Personalizzare Token di Brand e Logo

### Palette Colori
I colori ufficiali del brand sono definiti in `src/styles/_tokens.scss` (Dark mode) e `src/styles/_tokens_light.scss` (Light mode):

```scss
/* Brand ufficiale */
--color-brand-orange: #ff5500;
--color-brand-navy: #071526;
--color-brand-mint: #5ef2b8;
--color-brand-blue: #1e66fa;
--color-brand-white: #ffffff;
--color-brand-black: #000000;
```
Tutti i colori semantici (`--color-surface`, `--color-text-muted`, `--color-accent`, `--color-border`) sono derivati in modo armonioso con contrasti verificati.

### Loghi
I loghi mostrati nella barra superiore e nella schermata iniziale sono gestiti centralmente in:
[LogoPlaceholder.tsx](file:///Users/daniel/Projects/github/provocazioni-shiftate-antigravity/src/components/layout/LogoPlaceholder.tsx).
Puoi sostituire i vettori SVG con nuove icone o file immagine preservando l'allineamento.

---

## 14. Offline, PWA & Gestione Cache

- **Font WOFF2 locali**: tutti i font (IBM Plex Sans, IBM Plex Mono, Roboto, Alfa Slab One) sono archiviati localmente in `public/fonts/`.
- **Precache Automatico e Manuale (`useOfflineCache`)**: l'applicazione esegue il precache di tutti gli asset compilati, shell HTML, font e immagini delle slide e delle provocazioni.
- **Pannello di Monitoraggio Cache**: nel pannello di configurazione (`/`) è visibile lo stato attuale della cache con contatore e percentuale. Il pulsante dedicato permette di forzare una risincronizzazione manuale degli asset.
- **Installazione PWA**: se supportata dal browser, il pulsante "Installa App (PWA)" nel pannello consente di installare l'app come applicazione standalone nativa.
- **Screen Wake Lock**: mantiene attivo lo schermo del computer portatile durante l'intera durata del talk per scongiurare screen-saver o standby.
- **Nessuna dipendenza runtime esterna**: l'app funziona regolarmente in modalità aereo o con Wi-Fi di sala instabile.
