import { Fragment, type ReactNode } from "react";
import styles from "./SpeakerView.module.scss";

// Regex token per formattazione inline:
// 1. [[Speaker]] (es. [[Daniel]], [[Ste]], [[Klippy]], [[Entrambi]])
// 2. [Commento inline / quote] (es. [Dire qui: '...'], [Pausa drammatica])
// 3. *grassetto* (stile WhatsApp: *testo*)
// 4. _corsivo_ (stile WhatsApp: _testo_)
const TOKEN_REGEX =
  /(\[\[[^\]\n]+\]\]|(?<!\[)\[[^\[\]\n]+\](?!\])|\*(?!\s)[^*\n]+?(?<!\s)\*|_(?!\s)[^_\n]+?(?<!\s)_)/g;

/**
 * Restituisce la classe CSS e l'icona da abbinare al tag dello speaker.
 */
function getSpeakerMetadata(name: string): { className: string; icon: string } {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("daniel")) {
    return {
      className: `${styles.speakerTag} ${styles.speakerDaniel}`,
      icon: "🎙️",
    };
  }

  if (normalized.includes("ste") || normalized.includes("stefano")) {
    return {
      className: `${styles.speakerTag} ${styles.speakerSte}`,
      icon: "🎙️",
    };
  }

  if (
    normalized.includes("entrambi") ||
    normalized.includes("tutti") ||
    normalized.includes("both") ||
    normalized.includes("&") ||
    normalized.includes("+")
  ) {
    return {
      className: `${styles.speakerTag} ${styles.speakerBoth}`,
      icon: "👥",
    };
  }

  if (normalized.includes("klippy")) {
    return {
      className: `${styles.speakerTag} ${styles.speakerKlippy}`,
      icon: "📎",
    };
  }

  return {
    className: `${styles.speakerTag} ${styles.speakerDefault}`,
    icon: "🎙️",
  };
}

/**
 * Formatta ricorsivamente frammenti di testo inline gestendo:
 * - [[Speaker]]: pill badge personalizzato con icona e colore per speaker
 * - [Commento]: mark evidenziato per note di regia e suggerimenti vocali
 * - *grassetto*: testo in grassetto
 * - _corsivo_: testo in corsivo
 * e qualsiasi combinazione o annidamento tra essi.
 */
export function renderInlineFormatted(
  text: string,
  keyPrefix = "fmt"
): ReactNode[] {
  if (!text) return [];

  const parts = text.split(TOKEN_REGEX);

  return parts
    .map((part, index) => {
      if (!part) return null;
      const key = `${keyPrefix}-${index}`;

      // [[Speaker]]
      if (part.startsWith("[[") && part.endsWith("]]") && part.length >= 4) {
        const rawName = part.slice(2, -2).trim();
        const { className, icon } = getSpeakerMetadata(rawName);
        return (
          <span key={key} className={className} title={`Speaker: ${rawName}`}>
            <span className={styles.speakerIcon}>{icon}</span>
            <span className={styles.speakerName}>{rawName}</span>
          </span>
        );
      }

      // [Commento inline / regia]
      if (part.startsWith("[") && part.endsWith("]") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <mark key={key} className={styles.speakerQuote}>
            [{renderInlineFormatted(inner, `${key}-inner`)}]
          </mark>
        );
      }

      // *grassetto*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <strong key={key} className={styles.boldText}>
            {renderInlineFormatted(inner, `${key}-inner`)}
          </strong>
        );
      }

      // _corsivo_
      if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return (
          <em key={key} className={styles.italicText}>
            {renderInlineFormatted(inner, `${key}-inner`)}
          </em>
        );
      }

      return <Fragment key={key}>{part}</Fragment>;
    })
    .filter((node): node is NonNullable<typeof node> => node !== null);
}

interface BlockList {
  type: "list";
  items: string[];
}

interface BlockParagraph {
  type: "paragraph";
  lines: string[];
}

type Block = BlockList | BlockParagraph;

/**
 * Analizza le righe di un testo e le raggruppa in:
 * - Elenchi puntati: righe che iniziano con '-' (es. '- punto 1')
 * - Paragrafi: blocchi di testo separati da righe vuote
 */
function parseBlocks(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let currentList: string[] | null = null;
  let currentParagraph: string[] | null = null;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
      currentList = null;
    }
  };

  const flushParagraph = () => {
    if (currentParagraph && currentParagraph.length > 0) {
      blocks.push({ type: "paragraph", lines: currentParagraph });
      currentParagraph = null;
    }
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // Riconosce righe che iniziano con '-' escludendo divisioni multiple come '---'
    const bulletMatch = rawLine.match(/^\s*-(?!-)\s*(.*)$/);

    if (bulletMatch && bulletMatch[1] !== undefined) {
      flushParagraph();
      if (!currentList) currentList = [];
      currentList.push(bulletMatch[1]);
    } else if (trimmed === "") {
      flushList();
      flushParagraph();
    } else {
      flushList();
      if (!currentParagraph) currentParagraph = [];
      currentParagraph.push(rawLine);
    }
  }

  flushList();
  flushParagraph();
  return blocks;
}

/**
 * Renderizza un testo completo di note dello speaker con supporto a:
 * - Elenchi puntati ('- elemento')
 * - Speaker tag ('[[Daniel]]', '[[Ste]]', ecc.)
 * - Commenti e regie inline ('[nota]')
 * - Grassetto e corsivo WhatsApp ('*bold*', '_italico_')
 * - Combinazioni multiple di tutti gli stili
 */
export function renderFormattedSpeakerNotes(text: string): ReactNode {
  if (!text) return null;

  const blocks = parseBlocks(text);

  return (
    <div className={styles.notesContainer}>
      {blocks.map((block, bIdx) => {
        if (block.type === "list") {
          return (
            <ul key={`b-${bIdx}`} className={styles.notesList}>
              {block.items.map((item, iIdx) => (
                <li key={`b-${bIdx}-li-${iIdx}`} className={styles.notesListItem}>
                  {renderInlineFormatted(item, `b-${bIdx}-li-${iIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`b-${bIdx}`} className={styles.notesParagraph}>
            {block.lines.map((line, lIdx) => (
              <Fragment key={`b-${bIdx}-l-${lIdx}`}>
                {renderInlineFormatted(line, `b-${bIdx}-l-${lIdx}`)}
                {lIdx < block.lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
