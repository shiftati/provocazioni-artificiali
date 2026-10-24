export interface SpeakerNote {
  slideId?: string;
  provocationId?: string;
  title: string;
  notes?: string;
  hints?: string;
}

// Mappa slideId -> SpeakerNote
export const SLIDE_NOTES: Record<string, SpeakerNote> = {
  titolo: {
    slideId: "titolo",
    title: "Titolo",
    notes:
      `[[DANIEL]]
      Quanti di voi si sentono _*DAVVERO*_ protagonisti del cambiamento che sta avvenendo nel mondo dello sviluppo software?
      [Chiedere di alzare la mano]`,
    hints:
      "Chiedere di alzare la mano",
  },
  "gli-esperti": {
    slideId: "gli-esperti",
    title: "Gli esperti",
    notes:
      `[[STE]]
Questo è il futuro descritto dagli _"esperti"_:
[Pausa d'effetto]
- Fai i soldi facili con l'AI
- l'AI ci distruggerà tutti
- l'AI come oracolo 
- I Dev senza lavoro
Sono tutti scenari che *subiamo*. 
Ma in questo talk vogliamo fare l'*opposto*, 
Vogliamo _cambiare questa prospettiva_.. Magari non cambieremo il mondo, ma possiamo trovare dei *nuovi modi per adattarci* ad esso! 
In questo talk saremo tutti protagonisti...
`,
    hints:
      "Pausa d'effetto prima dell'elenco puntato per far assimilare l'immagine",
  },
  "developer-qualunque": {
    slideId: "developer-qualunque",
    title: "Developer qualunque",
    notes:
      `[[DANIEL]]
      …anche tu, sviluppatore qualunque!`,
    hints:
      "È una slide comica, non didattica. Prendere tempo qui se il ritmo sembra troppo veloce. Se il pubblico ride, assecondiamo.",
  },
  "macchinetta-caffe": {
    slideId: "macchinetta-caffe",
    title: "Macchinetta del caffè",
    notes:
      `[[DANIEL]]
      Alla macchinetta del caffè si dice vengano le idee migliori.
Vogliamo _ricreare lo stesso ambiente_, qui, al Codemotion.

Qui, non importa che tu sia il _CEO_ "mega presiden gran figli di put" o il _tirocinante sottopagato_ che fa data entry da 6 mesi, siete tutti *liberi di dare la propria opinione*, senza i vincoli dati da un meeting “ufficiale” da cui dipendono le sorti dell'azienda.

Per ricreare questo ambiente, iniziamo con un piccolo passo: *conosciamoci meglio*!
`,
  },
  "daniel-e-ste": {
    slideId: "daniel-e-ste",
    title: "Daniel e Ste",
    notes: `
- [[Ste]] Io sono Stefano, sto provando a diventare bravo in Age of Empire 4 (se qualcuno si vuole unire, scrivetemi), per il resto faccio il CTO per azienda del mondo Cyber Security.

- [[Daniel]] Team Leader / Tech Leader in una società di consulenza di Milano. Sono un *"cercatore di esperienze"*. Adoro conoscere le persone, sono molto curioso, mi diverto a fare progetti creativi come cortometraggi, grafiche, applicazioni...E da qualche anno mi sono immerso nell'*Improvvisazione Teatrale* che mi ha insegnato che _non esistono errori ma solo infinite possibilità_
  
- [[Ste]] Ah giusto lui è [[Klippy]] e tutti e tre insieme siamo *Shiftati di Testa*, abbiamo un nostro podcast e una pagina Instagram dove parliamo di quello di cui abbiamo voglia di parlare.

- [[Daniel]] E non so se ve ne siete accorti, ma Klippy è presente in ogni nsotra slide: è la nostra mascotte dolce e teneramente stupida.
`,
  },
  "ritorno-al-futuro": {
    slideId: "ritorno-al-futuro",
    title: "Ritorno al Futuro",
    notes: `[[Daniel]]
    Ritorno al Futuro è un film che ha _sbagliato *TUTTE* le previsioni sul futuro_!

Ci avevano promesso scarpe autoallaccianti, giacche termiche e squali olografici in 3D, e poi, nel bar ci sono ancora i televisori col tubo catodico.

Eppure lo amiamo. 

Perché quel film non doveva prevedere la realtà: doveva *accendere l'immaginazione*. 
E infatti ha ispirato generazioni di registi: tutti i film che parlano di viaggi nel tempo, si sono ispirati proprio a Ritorno al Futuro.

Ecco, oggi in questa stanza *noi dobbiamo essere esattamente come Ritorno al Futuro*.
Dobbiamo:
- Esagerare
- Proporre idee che all'inizio sembrano assurde o ridicole. 
- Anche un'ipotesi "sbagliata" ha un potere enorme: può essere la scintilla che accende l'intuizione geniale della persona seduta accanto a voi.
- Quindi oggi niente censure, niente filtri, niente formalismi. 
- Dite quello che vi passa per la testa, come vi viene in mente. 

Fate conto che non siamo a un meeting aziendale dove quello che diremo deciderà le sorti dell'azienda: siamo davanti alla macchinetta del caffè. 

_…portiamo questa *macchinetta a 88 miglia orarie* e vediamo dove arriviamo!_

[[STE]]
E io so già come fare…
`,
    hints:
      `Cercare di essere energetico e soffermarsi su alcuni punti importanti come:
      - Sbagliato tutte le previsioni
      - Eppure lo amiamo
      - accendere l'immaginazione`,
  },
  "klippy-saw": {
    slideId: "klippy-saw",
    title: "Klippy Saw",
    notes: `[[STE]]
Faremo un gioco con voi!`,
    hints:
      "Esagerate l'espressione drammatica da Saw l'enigmista: è una slide volutamente comica e teatrale, ridete e coinvolgete il pubblico.",
  },
  "fight-club": {
    slideId: "fight-club",
    title: "Fight Club",
    notes: `[[Ste]]
    Il gioco si basa su una *PROVOCAZIONE*: un concetto assurdo/esagerato di cui si andrà a discutere.

*REGOLA #1*
Avete presente il Fight Club? _“prima regola del fight club, non si parla del fight club”_ → In questo caso *DOVETE* parlare!!
  
*REGOLA #2*:
Parte un timer di _30 secondi_: il primo che alza la mano propone la provocazione

*REGOLA #3*:
Scelta la provocazione, partirà un altro timer di 5 minuti in cui tutti potremo dire la nostra.
Quando vi viene in mente qualcosa alzate la mano e io o Daniel verremo a darvi la parola.

[[DANIEL]] Quindi di base il talk lo farete voi!!! 


[[STE]] Vi facciamo qualche esempio di provocazione:
`,
    hints:
      "Daniel dice solo quella frase buttata lì per alleggerire la spiegazione delle regole",
  },
  "klippy-lotta-ai": {
    slideId: "klippy-lotta-ai",
    title: "Klippy lotta tra AI",
    notes: `[[STE]]
*La cybersicurezza sarà una lotta tra AI*

Ha ancora senso il ruolo dell'esperto di cybersicurezza quando saranno le AI a combattere tra loro?

[[DANIEL]]
[Far notare Daniel e Ste che bevono il tè]
`,
    hints:
      "Bisogna dire il titolo molto chiaramente e poi fare il commento in maniera più soft",
  },
  "klippy-matrix": {
    slideId: "klippy-matrix",
    title: "Klippy Matrix",
    notes: `[[STE]]
*La documentazione non ha più senso*

Che senso ha scrivere la documentazione in un mondo in cui è l'AI stessa a scrivere codice?

[[DANIEL]]
Vista l'ora e viste le facce, direi di fare un esempio pratico XD
`,
  },
  "io-sono-eccellenza": {
    slideId: "io-sono-eccellenza",
    title: "Io sono eccellenza",
    notes: `[[STE]]
Abbiamo fatto un po' di provocazioni, abbiamo raccolto delle idee.

La nostra domanda di base era _"di che cosa vale la pena parlare?"_.
Io ed Dani ormai abbiamo più di 40 anni di esperienza in due in questo ambito eppure in questo periodo storico ci siamo chiesti:

_abbiamo un *collega iper competente* che potenzialmente può fare tutto meglio di te, che ha la risposta a tutte le tue domande, quindi che cosa ci rende speciali?_

Cosa possiamo fare per eccellere in questo mondo dove l'eccellenza tecnica è alla portata di tutti?

E la risposta che ci siamo dati è che la nostra eccellenza è *saper unire i puntini*, prendere l'iniziativa e *unire competenze diverse* in vari ambiti che ci rendono speciali, cioè magari riuscire a far parlare le AI con il business, riuscire a far parlare il business con il junior, dare la nostra esperienza ancora per far diventare un junior, un senior, oppure riuscire a guidare, a mettere insieme cose diverse. 

Cioè, *l'ECCELLENZA per noi è unire più competenze*. Non è solo l'idea di prendersi il manuale di Java e diventare il massimo esperto di Java, ma unire la nostra competenza tecnica con le nostre *doti che ci rendono UMANI*.
`,
    hints:
      "Dare importanza alla domanda del _*collega iper competente*_ e ovviamente a _*unire i puntini*_",
  },
  selfie: {
    slideId: "selfie",
    title: "Selfie",
    notes: `[[DANIEL]]
    
    _*...e cosa c'è di più UMANO di quello che abbiamo fatto oggi?*_

- Prima di tutto ci tengo a *RINGRAZIARE* di cuore chi ha partecipato (ci vuole coraggio nel mettersi in gioco!)... Il bello è che questo talk è irripetibile, perché ognuno di noi è UNICO con una propria PERSONALE esperienza, costruita giorno per giorno in 5, 10, 20 anni... la conoscenza dell'AI è solo una "media" di tutte le nostre esperienze (e neanche tutte perché si basa sul codice che ha "studiato") ma non su quello che ognuno di noi ha vissuto realmente.

- Oggi abbiamo fatto una cosa molto utile: ci siamo *CONFRONTATI*. Una caratteristica che abbiamo noi umani è pensare fuori dagli schemi e quello che ci siamo dati oggi, sono delle prospettive diverse da cui possiamo prendere spunto.

- Il confronto "accende" la *CREATIVITÀ* che porta a idee nuove, [...TODO...] e presi singolarmente siamo limitati al nostro pensiero (e a quello dell'AI che usiamo come consulente)! Siamo animali sociali e abbiamo bisogno gli uni degli altri per dare il meglio di noi. E la cosa bella è che oggi l'AI (che scrive codice per noi) ci permette di avere _più tempo da dedicare_ a quello che ci rende umani.

- L'AI, almeno in questi ultimi anni, è per definizione "ricerca e sviluppo", nessuno può studiarla da un manuale (come si faceva con Java o React) per imparare ad usarla... Qui ci si sporca le mani ogni giorno, si sbaglia, si sbatte la tesa e si trovano soluzioni. Queste scoperte non si trovano (solo) nel codice, ma dentro l'esperienza personale di ognuno di noi ed è nostro dovere condividerla.

Non voglio fare paternali o altro, volevo sfruttare l'opportunità che ho avuto oggi di stare qui sul palco davanti a tante persone per condividere un pensiero che avevo da tempo.

Per chi non mi conosce, sono uno di quelli che adora fare selfie con le persone: se andate sul mio profilo Instagram troverete un muro di selfie con persone che ho trovato interessanti. E oggi vorrei immortalare questo bellissimo momento con voi con un mega selfie di gruppo!

[SELFIE di gruppo]
`,
    hints:
      "Tenete lo smartphone già pronto a portata di mano per non creare tempi morti",
  },
  finale: {
    slideId: "finale",
    title: "Finale",
    notes: `[[STE]]
Ci teniamo a salutarvi con questa ultima frase dal film che ha ispirato questo talk (qualcuno potrebbe già averla intuita): 

[[STE]] _Il futuro è come ve lo creerete voi…_

[[DANIEL]] _…perciò createvelo buono!_

[MUSICA che parte con l'ultima parte della frase]
`,
    hints:
      "Quando parte la musica di Ritorno al Futuro, lasciare spazio all'audio orchestrale. Lasciare la card col QR visibile per le domande finali.",
  },
  nero: {
    slideId: "nero",
    title: "Schermo Nero",
    notes: `Non c'è nulla da dire qui, è uno schermo nero XD`,
    }
};

// Mappa provocationId -> SpeakerNote
export const PROVOCATION_NOTES: Record<string, SpeakerNote> = {
  "saas-morto": {
    provocationId: "saas-morto",
    title: "Il SaaS è morto",
    notes: `[[STE]]*Il SaaS è morto, meglio un software generato su misura*

[Per alzata di mano → chi è d'accordo con questa frase?]

- Il reparto IT dell'azienda si riscrive da zero il prodotto e lo fa specifico per il suo caso.
- Rifare *Trello* è facile e ci posso aggiungere le funzionalità premium con un prompt
- Un gestionale aziendale sovrastrutturato magari ha funzionalità inutili che rendono il software complicato. Magari alla mia azienda basta una schermata personalizzata per utente...

[[DANIEL]] *Il Saas vivrà (lunga vita al SaaS!)*
- Se il SaaS è basato su *INFRASTRUTTURE COMPLESSE* però non puoi farlo: rifare *Google Drive* → è facile a livello di codice, ma replicare l'infrastruttura ha un costo spropositato
- Non tutti hanno le conoscenze del *DOMINIO* per farlo (bene): *Iubenda* senza conoscenze specifiche della parte legale/burocratica è un rischio da rifare.
`,
  },
  "software-usa-e-getta": {
    provocationId: "software-usa-e-getta",
    title: "Il Software diventerà usa e getta",
  },
  "agile-morto": {
    provocationId: "agile-morto",
    title: "AGILE è finalmente morto",    
  },
  "societa-consulenza": {
    provocationId: "societa-consulenza",
    title: "Le società di consulenza falliranno",
  },
  "team-grandi-controproducenti": {
    provocationId: "team-grandi-controproducenti",
    title: "I team grandi sono controproducenti",
  },
  "open-source-morto": {
    provocationId: "open-source-morto",
    title: "L'open source è morto",
  },
  "colloquio-tecnico": {
    provocationId: "colloquio-tecnico",
    title: "Il colloquio tecnico sul codice non ha più senso",
  },
  "sviluppo-software-morto": {
    provocationId: "sviluppo-software-morto",
    title: "Il mondo dello sviluppo software è morto",
  },
  "esperto-tecnologia": {
    provocationId: "esperto-tecnologia",
    title: "Non ha più senso diventare esperti in tecnologia",
  },
};

// Note per gli stati speciali del gioco
export const GAME_STATE_NOTES: Record<string, SpeakerNote> = {
  IDLE: {
    title: "Avvio Gioco Klippy Saw",
    notes: `[[DANIEL]]
    Vista l’ora e viste le facce, direi di fare un esempio pratico XD
`,
    hints:
      "Prima provocazione: il primo loop salta il timer di sfida ed entra direttamente nella card della provocazione.",
  },
  CHALLENGE: {
    title: "Sfida 30 secondi",
    notes: `*Fase Countdown Sfida (30 secondi)*:

[[Entrambi]]:
- Timer di 30 secondi attivo a schermo!
- [Dire qui: '30 secondi per votare: chi vuole affrontare questa provocazione? Accettiamo o scartiamo?']
- Osservare il fermento in sala, ascoltare i mormorii e incitare il pubblico a prendere posizione.
`,
    hints:
      "Se il pubblico è convinto, cliccare 'Accetta Provocazione' (o premere tasto Avanti) per iniziare i 5 minuti di discussione.",
  },
  DISCUSSION: {
    title: "Discussione in Corso (5 minuti)",
    notes: `*Fase Discussione Aperta (Timer 5:00 minuti)*:

[[Entrambi]]:
- 5 minuti di dibattito serrato con la platea!
- Moderare gli interventi senza monopolizzare la parola.
- [Dire qui: 'Chi alza la mano per primo? Perché sei d'accordo o contrario?']
- Usare il pulsante *Pausa/Riprendi* in caso di interventi lunghi o complessi.
- Allo scadere o al termine dell'energia, cliccare *'Prossima provocazione'* per pescarne un'altra.
`,
    hints:
      "Se il pubblico è timido all'inizio, fate una domanda diretta a una persona sorridente nelle prime file per rompere il ghiaccio.",
  },
};
