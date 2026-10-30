// Ogni domanda ha 1 risposta corretta (a) e 3 sbagliate: options contiene tutte e 4.
export const WRONG_COUNT = 3;

const clean = (s) => (typeof s === 'string' ? s.trim() : '');

// Cosa manca perché la domanda sia giocabile (lista vuota = completa)
export const missingParts = (q) => {
  const issues = [];
  const a = clean(q?.a);
  const wrong = (Array.isArray(q?.options) ? q.options : []).map(clean).filter((o) => o && o !== a);
  if (!clean(q?.q)) issues.push('manca il testo della domanda');
  if (!a) issues.push('manca la risposta corretta');
  if (wrong.length < WRONG_COUNT) {
    const n = WRONG_COUNT - wrong.length;
    issues.push(n === 1 ? 'manca 1 risposta sbagliata' : `mancano ${n} risposte sbagliate`);
  }
  const all = [a, ...wrong].filter(Boolean).map((o) => o.toLowerCase());
  if (new Set(all).size < all.length) issues.push('ci sono risposte uguali');
  return issues;
};

export const isPlayable = (q) => {
  if (!q || missingParts(q).length > 0) return false;
  return q.options.length === WRONG_COUNT + 1 && q.options.includes(q.a);
};

const ANSWER_PREFIX = /^(r|risp|risposta)\s*[:.)-]\s*/i;

// Separa la risposta corretta dalle eventuali sbagliate: "CORRETTA | SBAGLIATA 1 | SBAGLIATA 2 | ..."
const splitAnswers = (text) => {
  const parts = text.replace(ANSWER_PREFIX, '').split('|').map((p) => p.trim());
  return { a: parts[0] || '', wrong: parts.slice(1).filter(Boolean).slice(0, WRONG_COUNT) };
};

// Legge un file di testo con domande numerate, ad esempio:
//   1)  Qual è la capitale d'Italia? ROMA
//   2)  Qual è la capitale d'Italia? ROMA | MILANO | NAPOLI | TORINO
//   3.  Domanda senza punto interrogativo - Risposta
// La risposta è il testo dopo l'ultimo "?" (oppure dopo " - "), o la riga successiva.
export const parseQuestionsTxt = (text) => {
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\r?\n/).map((l) => l.trim());
  const out = [];

  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^(\d+)\s*[).:-]\s*(.+)$/);
    if (m) {
      const body = m[2].trim();
      const qi = body.lastIndexOf('?');
      let q = body;
      let rest = '';
      if (qi >= 0) {
        q = body.slice(0, qi + 1).trim();
        rest = body.slice(qi + 1).trim();
      } else {
        const dash = body.match(/^(.+?)\s+[-–—]\s+(.+)$/);
        if (dash) {
          q = dash[1].trim();
          rest = dash[2].trim();
        }
      }
      out.push({ q, ...splitAnswers(rest) });
    } else if (out.length && !out[out.length - 1].a) {
      // Risposta scritta sulla riga successiva alla domanda
      Object.assign(out[out.length - 1], splitAnswers(line));
    }
  }

  return out
    .filter((q) => q.q)
    .map(({ q, a, wrong }) => ({ q, a, options: [a, ...wrong].filter(Boolean) }));
};
