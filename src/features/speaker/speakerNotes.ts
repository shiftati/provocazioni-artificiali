export interface SpeakerNote {
  slideId?: string;
  provocationId?: string;
  title: string;
  notes: string;
  hints?: string;
}

// Mappa slideId -> SpeakerNote
export const SLIDE_NOTES: Record<string, SpeakerNote> = {
  titolo: {
    slideId: "titolo",
    title: "Titolo",
    notes:
      "Benvenuti! Mentre la slide carica, salutate il pubblico e presentatevi brevemente.\n\n[Dire qui: 'Buongiorno a tutti, sono Daniel, oggi parliamo di provocazioni artificiali nel mondo dello sviluppo software.']\n\nRicordate di attivare il timer e controllare che il microfono sia acceso.",
    hints:
      "Se c'è ritardo tecnico, fate una battuta sul fatto che anche Klippy ha i suoi giorni no. Sorridete.",
  },
  "gli-esperti": {
    slideId: "gli-esperti",
    title: "Gli esperti",
    notes:
      "Mostrate la slide degli esperti e lasciate che il pubblico la osservi per qualche secondo.\n\n[Dire qui: 'Quanti di voi si definirebbero esperti nel proprio campo?'] Aspettate che qualcuno alzi la mano.\n\nRiflettiamo insieme su cosa significa davvero essere esperti nell'era dell'AI.",
    hints:
      "Se nessuno alza la mano, sorridete e dite: 'Bene, siete già più intelligenti della media.' Se tutti alzano la mano, fate notare l'ironia.",
  },
  "developer-qualunque": {
    slideId: "developer-qualunque",
    title: "Developer qualunque",
    notes:
      "La slide del developer qualunque. Ironizzate sulla figura dello sviluppatore medio che conosce tutto superficialmente.\n\n[Dire qui: 'Il developer qualunque sa fare un po' di tutto: un po' di React, un po' di Python, un po' di DevOps... e pochissimo di tutto.']\n\nQuesta slide serve a sdrammatizzare: siamo tutti un po' così.",
    hints:
      "È una slide comica, non didattica. Prendete tempo qui se il ritmo sembra troppo veloce. Il pubblico ride — assecondate.",
  },
  "macchinetta-caffe": {
    slideId: "macchinetta-caffe",
    title: "Macchinetta del caffè",
    notes:
      "[Dire qui: 'Volete sapere com'è programmare nel 2025 con l'AI? È come avere una macchinetta del caffè che fa anche le email — ma non capisce il tono.']\n\nQuesta metafora introduce il tema dell'AI come strumento: potente, ma con limiti precisi. Tenete il tono leggero.",
    hints:
      "Se avete il caffè in mano durante la presentazione, questo è il momento perfetto per berlo. La gente ride.",
  },
  "daniel-e-ste": {
    slideId: "daniel-e-ste",
    title: "Daniel e Ste",
    notes:
      "Presentazione degli speaker. Presentate prima Ste, poi Daniel, poi Klippy (l'AI).\n\n[Dire qui: 'Io sono Daniel, lui è Ste, e il nostro terzo collega — quello che non dorme mai e non chiede aumenti — è Klippy.']\n\nBreve, simpatico, non troppo lungo.",
    hints:
      "Non esagerate con le bio: 30 secondi a testa max. Il pubblico è qui per le provocazioni, non per il curriculum.",
  },
  "ritorno-al-futuro": {
    slideId: "ritorno-al-futuro",
    title: "Ritorno al Futuro",
    notes:
      "Slide di transizione tematica. Usiamo la metafora del viaggio nel tempo per introdurre il futuro dello sviluppo software.\n\n[Dire qui: 'Se tornaste nel 2015 e raccontaste l'AI di oggi, nessuno vi crederebbe. Ora immaginate tra 10 anni.']\n\nQuesto prepara il terreno per le provocazioni.",
    hints:
      "Pausa drammatica dopo 'tra 10 anni.' Lasciate che la frase atterri. Non riempite il silenzio subito.",
  },
  "klippy-saw": {
    slideId: "klippy-saw",
    title: "Klippy Saw",
    notes:
      "Slide di rottura del ritmo. Klippy nei panni di Jigsaw: 'Voglio giocare a un gioco.'\n\n[Dire qui: 'Come nel film, anche noi vogliamo mettere il pubblico in una situazione scomoda — ma con più umorismo e meno sangue.']\n\nQuesta introduce il gioco delle provocazioni.",
    hints:
      "Exaggerate l'espressione drammatica. La slide è volutamente assurda — ridete anche voi.",
  },
  "fight-club": {
    slideId: "fight-club",
    title: "Fight Club",
    notes:
      "[Dire qui: 'La prima regola del Fight Club del software è: non parlare delle decisioni architetturali prese alle 23 di venerdì.']\n\nQuesta slide introduce il tema della 'verità scomoda' che il talk vuole affrontare. Metafora del fight club = dire le cose che normalmente non si dicono.",
    hints:
      "Se il pubblico conosce il film, ci sarà una risata al 'prima regola'. Aspettate che finisca prima di continuare.",
  },
  "klippy-lotta-ai": {
    slideId: "klippy-lotta-ai",
    title: "Klippy lotta tra AI",
    notes:
      "Slide sulla cybersicurezza e la competizione tra modelli AI. Klippy combatte contro altre AI.\n\n[Dire qui: 'Non è fantascienza: già oggi i modelli competono su benchmark, si copiano gli stili, si 'attaccano' a vicenda tramite prompt injection.']\n\nQui si torna sul serio per un momento.",
    hints:
      "Se avete esempi concreti di attacchi AI-vs-AI, citateli qui. Altrimenti la slide funziona anche senza.",
  },
  "klippy-matrix": {
    slideId: "klippy-matrix",
    title: "Klippy Matrix",
    notes:
      "Slide sulla documentazione insensata. Klippy precipita in un matrix di README mai letti.\n\n[Dire qui: 'Avete mai scritto documentazione che sapevate già che nessuno avrebbe mai letto? Alzate la mano. Sì, lo sapevo.']\n\nQui si ride, ma è anche un punto critico vero.",
    hints:
      "Questa slide è liberatoria. La gente ride perché si riconosce. Usatela per riprendere fiato prima delle provocazioni.",
  },
  "io-sono-eccellenza": {
    slideId: "io-sono-eccellenza",
    title: "Io sono eccellenza",
    notes:
      "[Dire qui: 'Tutti vogliamo essere 'eccellenti'. Ma eccellente rispetto a cosa? A chi? Misurato da chi?']\n\nQuesta slide critica il concetto di 'excellence culture' nel mondo tech. È provocatoria nel senso letterale.",
    hints:
      "Non rispondete alla domanda che ponete — lasciatela aperta. Il punto è la riflessione, non la soluzione.",
  },
  selfie: {
    slideId: "selfie",
    title: "Selfie",
    notes:
      "Momento interattivo! Chiedete al pubblico di fare un selfie con la slide o con voi.\n\n[Dire qui: 'Ok, momento social. Se volete condividere qualcosa del talk, questo è il momento perfetto. Hashtag... qualcosa.']\n\nÈ una pausa leggera e interattiva.",
    hints:
      "Se avete un hashtag ufficiale dell'evento, menzinatelo qui. Sorridete per la foto.",
  },
  finale: {
    slideId: "finale",
    title: "Finale",
    notes:
      "Slide conclusiva. Ringraziamenti, QR code, invito alla discussione.\n\n[Dire qui: 'Grazie per essere stati con noi. Il nostro scopo non era darvi risposte, ma farvi fare le domande giuste. Il QR code porta alle slide e ai contatti.']\n\nLasciate 2-3 minuti per domande dal pubblico.",
    hints:
      "Se il tempo è scaduto, abbreviate e rimandare alle domande informali. Non prolungate oltre il tempo.",
  },
  nero: {
    slideId: "nero",
    title: "Schermo Nero",
    notes:
      "Schermo nero finale. Il talk è concluso.\n\n[Se siete ancora sul palco: salutate, ringraziate l'organizzazione, e indicare dove trovarvi per domande informali.]\n\nSe c'è musica o applauso, lasciate che sia.",
    hints:
      "Non dite nulla di sostanziale su questo schermo. È il sipario. Godetevelo.",
  },
};

// Mappa provocationId -> SpeakerNote
export const PROVOCATION_NOTES: Record<string, SpeakerNote> = {
  "saas-morto": {
    provocationId: "saas-morto",
    title: "Il SaaS è morto",
    notes:
      "[Provocazione: 'Il SaaS è morto: meglio un software generato su misura']\n\nIntroducete la provocazione leggendo il titolo con tono assertivo. Poi chiedete: 'Chi è d'accordo? Chi è contrario?'\n\nIl punto centrale è che con l'AI generativa, il costo di generare software su misura sta crollando, rendendo le licenze SaaS meno competitive per alcuni use case.",
    hints:
      "Aspettatevi resistenza dal pubblico tech che usa SaaS ogni giorno. È normale — è una provocazione, non una verità assoluta. Gestite il dibattito con curiosità, non con difensività.",
  },
  "software-usa-e-getta": {
    provocationId: "software-usa-e-getta",
    title: "Il Software diventerà usa e getta",
    notes:
      "[Provocazione: 'Il Software diventerà usa e getta']\n\n[Dire qui: 'Immaginate un mondo in cui rigenerare un'app da zero è più conveniente che manutenere il debito tecnico. Fantascienza? Forse no.']\n\nL'argomento chiave: il costo marginale di generazione tende a zero, quindi il ciclo di vita del software si accorcia drasticamente.",
    hints:
      "Citate esempi concreti se li avete: script generati al volo, micro-app usa-e-getta per eventi, ecc. Sono più convincenti delle teorie astratte.",
  },
  "agile-morto": {
    provocationId: "agile-morto",
    title: "AGILE è finalmente morto",
    notes:
      "[Provocazione: 'AGILE è finalmente morto']\n\n[Dire qui: 'Non stiamo dicendo che i principi Agile siano sbagliati. Diciamo che la liturgia degli sprint, dei daily standup e degli story point è diventata una burocrazia peggiore di quella che voleva sostituire.']\n\nDistinguete tra i principi del Manifesto Agile (buoni) e l'implementazione industriale di Scrum/SAFe (discutibile).",
    hints:
      "Questa provocazione fa molto rumore. Preparatevi a opinioni forti in entrambe le direzioni. Tenete il dibattito sui fatti, non sulle emozioni.",
  },
  "societa-consulenza": {
    provocationId: "societa-consulenza",
    title: "Le società di consulenza falliranno",
    notes:
      "[Provocazione: 'Le società di consulenza falliranno']\n\n[Dire qui: 'Il modello 'ti affitto un developer a giornata' è sotto pressione. Se l'AI può fare il lavoro di un junior in un'ora, perché pagare 8 ore di body rental?']\n\nIl punto non è che tutte le consulenze falliranno, ma che il modello puro di vendita di ore è insostenibile a lungo termine.",
    hints:
      "Probabilmente in sala ci sono consulenti. Siate delicati ma onesti. La provocazione serve ad aprire una discussione, non ad offendere qualcuno.",
  },
  "team-grandi-controproducenti": {
    provocationId: "team-grandi-controproducenti",
    title: "I team grandi sono controproducenti",
    notes:
      "[Provocazione: 'I team grandi (da 2 persone in su) sono controproducenti']\n\n[Dire qui: 'Un developer con l'AI può fare il lavoro di un team di 5. Aggiungere persone aggiunge coordinamento, meeting, e conflitti — non necessariamente output.']\n\nCitate la legge di Brooks: 'Aggiungere persone a un progetto in ritardo lo fa ritardare ancora di più.'",
    hints:
      "La soglia '2 persone' è volutamente estrema per stimolare il dibattito. Se qualcuno la attacca, è un buon segno: significa che sta pensando.",
  },
  "open-source-morto": {
    provocationId: "open-source-morto",
    title: "L'open source è morto",
    notes:
      "[Provocazione: 'L'open source è morto']\n\n[Dire qui: 'I grandi modelli AI sono addestrati su codice open source, ma i pesi rimangono proprietari. È un patto che si è rotto — prendiamo il codice della community, ma non condividiamo i risultati.']\n\nEsempi: HashiCorp, Redis, Elasticsearch — tutti hanno cambiato licenza verso modelli commerciali.",
    hints:
      "Questa tocca la sensibilità ideologica di molti developer. Lasciate che esprimano la loro posizione prima di rispondere. Non è una gara da vincere.",
  },
  "colloquio-tecnico": {
    provocationId: "colloquio-tecnico",
    title: "Il colloquio tecnico sul codice non ha più senso",
    notes:
      "[Provocazione: 'Il colloquio tecnico sul codice non ha più senso']\n\n[Dire qui: 'Se in produzione il developer usa Copilot, ChatGPT e Stack Overflow, perché il colloquio vietato Google e con problemi di ordinamento di array?']\n\nIl punto: stiamo valutando competenze che non useremo mai nel lavoro reale.",
    hints:
      "Aspettatevi sia chi è d'accordo (i candidati frustrati) sia chi è contrario (i selezionatori). Entrambe le prospettive sono valide — esploratele.",
  },
  "sviluppo-software-morto": {
    provocationId: "sviluppo-software-morto",
    title: "Il mondo dello sviluppo software è morto",
    notes:
      "[Provocazione: 'Il mondo dello sviluppo software è morto']\n\n[Dire qui: 'Non diciamo che i programmatori spariranno. Diciamo che il mestiere di 'scrivere codice' si trasformerà in qualcosa di molto diverso — più vicino all'architettura, al pensiero sistemico, al dominio di business.']\n\nIl developer del futuro parla con i clienti, non con il compilatore.",
    hints:
      "Questa è la provocazione più esistenziale. Molti in sala potrebbero sentirsi minacciati. Usate empatia. Non è una cattiva notizia — è un invito ad evolvere.",
  },
  "esperto-tecnologia": {
    provocationId: "esperto-tecnologia",
    title: "Non ha più senso diventare esperti in tecnologia",
    notes:
      "[Provocazione: 'Non ha più senso diventare esperti in una tecnologia specifica']\n\n[Dire qui: 'Quando l'AI può imparare qualsiasi sintassi in secondi, il vantaggio competitivo non è sapere React a memoria — è capire perché usare React invece di qualcos'altro.']\n\nLa competenza si sposta dal 'saper fare' al 'saper scegliere e orchestrare'.",
    hints:
      "Distinguete tra expertise profondo (architettura, algoritmi, sicurezza) che rimane prezioso, e memorizzazione di API che invece diventa obsoleta. Questa distinzione calma i senior developer spaventati.",
  },
};

// Note per gli stati speciali del gioco
export const GAME_STATE_NOTES: Record<string, SpeakerNote> = {
  IDLE: {
    title: "Avvio Gioco",
    notes:
      "Il gioco è pronto per partire. Spiegate le regole al pubblico.\n\n[Dire qui: 'Stiamo per lanciare le provocazioni. Ogni provocazione è una tesi volutamente estrema. Avrete 30 secondi per decidere se siete d'accordo o no, poi ne discuteremo insieme.']\n\nAssicuratevi che tutti capiscano il meccanismo prima di iniziare.",
    hints:
      "Se il pubblico sembra disorientato, fate un esempio con una provocazione neutra. Meglio perdere 30 secondi in più che partire con confusione.",
  },
  CHALLENGE: {
    title: "Sfida 30 secondi",
    notes:
      "Il timer da 30 secondi è in corso. Il pubblico sta decidendo la propria posizione sulla provocazione.\n\n[Silenzio — lasciate pensare. Non parlate durante il countdown.]\n\nOsservate la reazione del pubblico: i mormorii, le facce, i gesti. Saranno utili per moderare la discussione successiva.",
    hints:
      "Non interrompete il countdown. Se qualcuno fa una domanda, dite: 'Ne parliamo tra 30 secondi.' Il tempo di riflessione è parte del gioco.",
  },
  DISCUSSION: {
    title: "Discussione",
    notes:
      "È il momento della discussione aperta sulla provocazione corrente.\n\n[Dire qui: 'Chi è d'accordo con questa provocazione? Chi è contrario? Perché?']\n\nIl vostro ruolo qui è moderare, non convincere. Portate voci diverse. Date spazio anche a chi non è d'accordo con voi.",
    hints:
      "Se nessuno parla, fate una domanda diretta a qualcuno: 'Tu, in fondo — cosa ne pensi?' Rompete il ghiaccio con curiosità genuina, non con pressione.",
  },
};
