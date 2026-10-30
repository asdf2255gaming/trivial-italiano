import { useState, useEffect, useCallback } from 'react';
import { categories as defaultCategories } from '../data/questions';
import { CATEGORY_ICONS } from '../data/icons';

const STORAGE_KEY = 'trivial-categories-v2';
const LEGACY_KEY = 'trivial-custom-questions-v1';

export const MIN_CATEGORIES = 2;
export const MAX_CATEGORIES = 12;

const sanitizeQuestion = (q) => {
  if (!q || typeof q.q !== 'string') return null;
  const out = { q: q.q, a: typeof q.a === 'string' ? q.a : '' };
  if (['easy', 'medium', 'hard'].includes(q.difficulty)) out.difficulty = q.difficulty;
  if (Array.isArray(q.options) && q.options.length > 0) out.options = q.options.map(String);
  return out;
};

// Valida una lista di spicchi (da localStorage o da un file di backup). Ritorna null se non valida.
export const sanitizeCategories = (list) => {
  if (!Array.isArray(list)) return null;
  const seen = new Set();
  const clean = list
    .filter((c) => c && typeof c.id === 'string' && c.id && !seen.has(c.id) && seen.add(c.id))
    .map((c) => ({
      id: c.id,
      name: typeof c.name === 'string' && c.name.trim() ? c.name : 'Senza nome',
      color: /^#[0-9a-f]{6}$/i.test(c.color) ? c.color : '#607D8B',
      icon: CATEGORY_ICONS[c.icon] ? c.icon : 'Star',
      questions: (Array.isArray(c.questions) ? c.questions : []).map(sanitizeQuestion).filter(Boolean),
    }));
  return clean.length >= MIN_CATEGORIES ? clean.slice(0, MAX_CATEGORIES) : null;
};

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeCategories(JSON.parse(raw));
      if (parsed) return parsed;
    }
    // Vecchio formato: solo le domande modificate delle 6 categorie fisse
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const overrides = JSON.parse(legacy) || {};
      return defaultCategories.map((c) => ({ ...c, questions: overrides[c.id] ?? c.questions }));
    }
  } catch {}
  return null;
};

const FILE_API = '/api/spicchi';

// Scrive gli spicchi in dati/spicchi.json tramite il server locale. Ritorna true se riuscito.
const writeFile = async (categories) => {
  try {
    const res = await fetch(FILE_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'trivial-italiano', version: 2, savedAt: new Date().toISOString(), categories }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Spicchi della ruota con le loro domande. La fonte principale è il file dati/spicchi.json
// (letto e scritto dal server locale); localStorage resta come copia nel browser, usata
// se il server non c'è. Finché non si salva nulla valgono gli spicchi predefiniti.
export const useQuestions = () => {
  const [stored, setStored] = useState(loadStored);
  const [storage, setStorage] = useState('browser'); // dove finiscono i salvataggi: 'file' | 'browser'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(FILE_API, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStorage('file');
        if (data.exists) {
          const clean = sanitizeCategories(data.categories);
          if (clean) setStored(clean);
        } else {
          // Primo avvio con il file: ci sposta le modifiche già salvate nel browser
          const local = loadStored();
          if (local) writeFile(local);
        }
      } catch {
        // Nessun server locale (es. versione statica): si resta sul browser
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      if (stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      else localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {}
  }, [stored]);

  const categories = stored || defaultCategories;

  // Ritorna 'file' se salvato nel file, 'browser' se solo nel browser, null se i dati non sono validi
  const saveCategories = useCallback(async (list) => {
    const clean = sanitizeCategories(list);
    if (!clean) return null;
    setStored(clean);
    const ok = await writeFile(clean);
    setStorage(ok ? 'file' : 'browser');
    return ok ? 'file' : 'browser';
  }, []);

  return { categories, saveCategories, storage };
};
