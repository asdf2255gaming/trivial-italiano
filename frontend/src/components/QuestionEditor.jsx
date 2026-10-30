import React, { useState, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, RotateCcw, Save, PenLine, Check, Upload, Download, FileText,
  AlertTriangle, Wand2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { categories as DEFAULT_CATEGORIES, DIFFICULTY_META } from '../data/questions';
import { ICON_NAMES, CATEGORY_COLORS, getCategoryIcon } from '../data/icons';
import { parseQuestionsTxt, isPlayable, missingParts, WRONG_COUNT } from '../utils/questionsTxt';
import QuestionCompleter from './QuestionCompleter';
import { sanitizeCategories, MIN_CATEGORIES, MAX_CATEGORIES } from '../hooks/useQuestions';

// Forma usata nell'editor: risposta corretta + 3 sbagliate, con una chiave stabile per React
let keySeq = 0;
const toEditable = (q) => {
  const a = q.a || '';
  const wrong = (Array.isArray(q.options) ? q.options : []).filter((o) => o && o !== a);
  while (wrong.length < WRONG_COUNT) wrong.push('');
  return {
    key: `q${++keySeq}`,
    q: q.q || '',
    a,
    wrong: wrong.slice(0, WRONG_COUNT),
    difficulty: q.difficulty || '',
  };
};

const toStored = (q) => {
  const a = q.a.trim();
  const out = { q: q.q.trim(), a, options: [a, ...q.wrong.map((w) => w.trim())].filter(Boolean) };
  if (q.difficulty) out.difficulty = q.difficulty;
  return out;
};

const issuesOf = (q) => missingParts(toStored(q));

const toEditableCategory = (c) => ({ ...c, questions: c.questions.map(toEditable) });

const emptyQ = () => toEditable({});

const download = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

const QuestionEditor = ({ categories, onSave, onClose, storage }) => {
  const { isDark } = useTheme();
  const [working, setWorking] = useState(() => categories.map(toEditableCategory));
  const [activeId, setActiveId] = useState(categories[0].id);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState(null);
  const [completer, setCompleter] = useState(null); // chiavi delle domande da completare
  const txtInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const current = working.find((c) => c.id === activeId) || working[0];
  const list = current.questions;
  const defaultCat = DEFAULT_CATEGORIES.find((c) => c.id === current.id);
  const missingDefaults = DEFAULT_CATEGORIES.filter((d) => !working.some((c) => c.id === d.id));

  const showToast = (text, warning = false) => {
    setToast({ text, warning });
    setTimeout(() => setToast(null), 2500);
  };

  const updateCurrent = (fn) => {
    setDirty(true);
    setWorking((prev) => prev.map((c) => (c.id === current.id ? fn(c) : c)));
  };

  const updateCatField = (field, value) => updateCurrent((c) => ({ ...c, [field]: value }));

  const updateQuestions = (fn) => updateCurrent((c) => ({ ...c, questions: fn(c.questions) }));

  const updateQ = (key, field, value, wrongIdx) =>
    updateQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key) return q;
        if (field !== 'wrong') return { ...q, [field]: value };
        const wrong = [...q.wrong];
        wrong[wrongIdx] = value;
        return { ...q, wrong };
      })
    );

  const addQ = () => updateQuestions((qs) => [...qs, emptyQ()]);

  const deleteQ = (key) => updateQuestions((qs) => qs.filter((q) => q.key !== key));

  const incompleteKeys = list.filter((q) => issuesOf(q).length > 0).map((q) => q.key);

  const addCategory = () => {
    if (working.length >= MAX_CATEGORIES) return;
    const usedColors = new Set(working.map((c) => c.color.toUpperCase()));
    const color = CATEGORY_COLORS.find((c) => !usedColors.has(c.toUpperCase())) || CATEGORY_COLORS[0];
    const cat = {
      id: `custom-${Date.now().toString(36)}`,
      name: 'Nuovo spicchio',
      color,
      icon: 'Star',
      questions: [],
    };
    setDirty(true);
    setWorking((prev) => [...prev, cat]);
    setActiveId(cat.id);
  };

  const deleteCategory = () => {
    if (working.length <= MIN_CATEGORIES) return;
    if (!window.confirm(`Eliminare lo spicchio "${current.name}" e tutte le sue ${list.length} domande?`)) return;
    const idx = working.findIndex((c) => c.id === current.id);
    const next = working.filter((c) => c.id !== current.id);
    setDirty(true);
    setWorking(next);
    setActiveId(next[Math.min(idx, next.length - 1)].id);
  };

  const restoreDefaults = () => {
    const room = MAX_CATEGORIES - working.length;
    const toAdd = missingDefaults.slice(0, room).map(toEditableCategory);
    if (toAdd.length === 0) return;
    setDirty(true);
    setWorking((prev) => {
      // Rimette gli spicchi originali nella loro posizione rispetto agli altri predefiniti
      const result = [...prev];
      toAdd.forEach((cat) => {
        const order = DEFAULT_CATEGORIES.findIndex((d) => d.id === cat.id);
        const before = result.findIndex(
          (c) => DEFAULT_CATEGORIES.findIndex((d) => d.id === c.id) > order
        );
        result.splice(before < 0 ? result.length : before, 0, cat);
      });
      return result;
    });
  };

  const resetCat = () => {
    if (!defaultCat) return;
    if (!window.confirm(`Ripristinare nome, colore, icona e domande predefinite per "${defaultCat.name}"?`)) return;
    updateCurrent(() => toEditableCategory(defaultCat));
  };

  const handleTxtImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const parsed = parseQuestionsTxt(await file.text());
    if (parsed.length === 0) {
      window.alert('Nessuna domanda trovata. Le righe devono iniziare con un numero, es: "1) Domanda? Risposta"');
      return;
    }
    const imported = parsed.map(toEditable);
    updateQuestions((qs) => [...qs, ...imported]);
    const toComplete = imported.filter((q) => issuesOf(q).length > 0).map((q) => q.key);
    showToast(`Importate ${parsed.length} domande`);
    // Subito dopo l'import chiede le risposte che mancano (di solito le 3 sbagliate)
    if (toComplete.length > 0) setCompleter(toComplete);
  };

  const buildStored = () =>
    working.map((c) => ({
      id: c.id,
      name: c.name.trim() || 'Senza nome',
      color: c.color,
      icon: c.icon,
      questions: c.questions.filter((q) => q.q.trim()).map(toStored),
    }));

  const handleSaveAll = async () => {
    const where = await onSave(buildStored());
    if (!where) {
      showToast('Dati non validi: servono almeno 2 spicchi', true);
      return;
    }
    setDirty(false);
    if (where === 'file') showToast('Salvato in dati/spicchi.json');
    else showToast('Salvato solo nel browser: file non raggiungibile', true);
  };

  const handleExportBackup = () => {
    const data = { app: 'trivial-italiano', version: 2, categories: buildStored() };
    download(
      `trivial-spicchi-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let clean = null;
    try {
      const data = JSON.parse(await file.text());
      clean = sanitizeCategories(Array.isArray(data) ? data : data.categories);
    } catch {}
    if (!clean) {
      window.alert('File di backup non valido.');
      return;
    }
    if (!window.confirm(`Sostituire tutti gli spicchi attuali con i ${clean.length} del backup?`)) return;
    setWorking(clean.map(toEditableCategory));
    setActiveId(clean[0].id);
    setDirty(true);
    showToast('Backup caricato: premi Salva per confermare');
  };

  const closeCompleter = useCallback(() => setCompleter(null), []);

  const handleClose = () => {
    if (dirty && !window.confirm('Ci sono modifiche non salvate. Chiudere comunque?')) return;
    onClose();
  };

  const bgPanel = isDark ? '#0f172a' : '#ffffff';
  const bgSoft = isDark ? '#1e293b' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputStyle = { background: bgPanel, color: textMain, border: `1px solid ${border}` };
  const labelCls = 'text-[11px] font-bold uppercase tracking-wider';
  const smallBtnCls = 'flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-colors hover:opacity-80';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 250ms ease',
        fontFamily: 'Fredoka, Poppins, sans-serif',
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: bgPanel,
          color: textMain,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'popIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxHeight: '90vh',
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>
              <PenLine size={22} color="#fff" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Editor di spicchi e domande</h2>
              <p className="text-sm" style={{ color: textMuted }}>
                Aggiungi o togli spicchi della ruota e scrivi le domande per ciascuno
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-500/20 transition-colors"
            style={{ color: textMuted }}
            aria-label="Chiudi"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Elenco spicchi */}
          <div
            className="md:w-60 p-3 md:border-r overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2 shrink-0"
            style={{ borderColor: border, background: bgSoft }}
          >
            {working.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const isActive = cat.id === current.id;
              const playable = cat.questions.filter((q) => isPlayable(toStored(q))).length;
              const incomplete = cat.questions.length - playable;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveId(cat.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-semibold text-sm transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? cat.color : 'transparent',
                    color: isActive ? '#fff' : textMain,
                    boxShadow: isActive ? `0 6px 16px ${cat.color}50` : 'none',
                  }}
                  title={
                    playable === 0
                      ? 'Senza domande complete: non compare sulla ruota'
                      : incomplete > 0
                      ? `${incomplete} domande da completare`
                      : undefined
                  }
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : cat.color }}
                  >
                    <Icon size={16} color="#fff" />
                  </div>
                  <span className="truncate md:max-w-[110px]">{cat.name || 'Senza nome'}</span>
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1"
                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : border, color: isActive ? '#fff' : textMuted }}
                  >
                    {incomplete > 0 && <AlertTriangle size={11} />}
                    {cat.questions.length}
                  </span>
                </button>
              );
            })}

            <button
              onClick={addCategory}
              disabled={working.length >= MAX_CATEGORIES}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm border-2 border-dashed whitespace-nowrap disabled:opacity-40"
              style={{ borderColor: border, color: textMuted }}
              title={working.length >= MAX_CATEGORIES ? `Massimo ${MAX_CATEGORIES} spicchi` : undefined}
            >
              <Plus size={16} /> Nuovo spicchio
            </button>
            {missingDefaults.length > 0 && (
              <button
                onClick={restoreDefaults}
                disabled={working.length >= MAX_CATEGORIES}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs whitespace-nowrap disabled:opacity-40"
                style={{ color: textMuted }}
              >
                <RotateCcw size={14} /> Ripristina spicchi originali ({missingDefaults.length})
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Impostazioni dello spicchio */}
            <div className="rounded-2xl p-4 border-2 space-y-3" style={{ borderColor: current.color, background: `${current.color}0d` }}>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className={labelCls} style={{ color: textMuted }}>Nome dello spicchio</label>
                  <input
                    value={current.name}
                    onChange={(e) => updateCatField('name', e.target.value)}
                    maxLength={30}
                    className="w-full mt-1 px-3 py-2 rounded-lg outline-none font-semibold focus:ring-2"
                    style={inputStyle}
                    placeholder="Es. Cucina italiana"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => txtInputRef.current?.click()} className={smallBtnCls} style={{ background: current.color, color: '#fff' }}>
                    <FileText size={16} /> Importa da .txt
                  </button>
                  {incompleteKeys.length > 0 && (
                    <button onClick={() => setCompleter(incompleteKeys)} className={smallBtnCls} style={{ background: '#f59e0b', color: '#fff' }}>
                      <Wand2 size={16} /> Completa {incompleteKeys.length} {incompleteKeys.length === 1 ? 'domanda' : 'domande'}
                    </button>
                  )}
                  {defaultCat && (
                    <button onClick={resetCat} className={smallBtnCls} style={{ background: border, color: textMain }}>
                      <RotateCcw size={16} /> Predefinite
                    </button>
                  )}
                  <button
                    onClick={deleteCategory}
                    disabled={working.length <= MIN_CATEGORIES}
                    className={`${smallBtnCls} text-red-500 disabled:opacity-40`}
                    style={{ background: '#ef444415' }}
                    title={working.length <= MIN_CATEGORIES ? `Servono almeno ${MIN_CATEGORIES} spicchi` : 'Elimina spicchio'}
                  >
                    <Trash2 size={16} /> Elimina spicchio
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ color: textMuted }}>Colore</label>
                <div className="flex gap-2 flex-wrap mt-1 items-center">
                  {CATEGORY_COLORS.map((col) => (
                    <button
                      key={col}
                      onClick={() => updateCatField('color', col)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: col, outline: current.color.toUpperCase() === col.toUpperCase() ? `3px solid ${textMain}` : 'none', outlineOffset: 2 }}
                      aria-label={`Colore ${col}`}
                    >
                      {current.color.toUpperCase() === col.toUpperCase() && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={current.color}
                    onChange={(e) => updateCatField('color', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                    title="Altro colore"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ color: textMuted }}>Icona</label>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {ICON_NAMES.map((name) => {
                    const Icon = getCategoryIcon(name);
                    const selected = current.icon === name;
                    return (
                      <button
                        key={name}
                        onClick={() => updateCatField('icon', name)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: selected ? current.color : bgSoft, border: `1px solid ${selected ? current.color : border}` }}
                        aria-label={name}
                      >
                        <Icon size={18} color={selected ? '#fff' : textMuted} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <input ref={txtInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleTxtImport} />
            </div>

            {list.length === 0 && (
              <div className="text-center py-8" style={{ color: textMuted }}>
                Nessuna domanda. Aggiungine una qui sotto oppure importa un file .txt con righe del tipo
                <div className="font-mono text-sm mt-2">1) Qual è la capitale d'Italia? ROMA</div>
                <div className="text-xs mt-2">
                  Le 3 risposte sbagliate te le chiedo dopo l'import, oppure scrivile già nel file:
                  <span className="font-mono"> ROMA | MILANO | NAPOLI | TORINO</span>
                </div>
              </div>
            )}

            {list.map((q, idx) => {
              const issues = issuesOf(q);
              return (
                <div
                  key={q.key}
                  className="rounded-2xl p-4 border-2"
                  style={{ background: bgSoft, borderColor: issues.length ? '#f59e0b' : border }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                      style={{ background: current.color, color: '#fff' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={q.difficulty}
                          onChange={(e) => updateQ(q.key, 'difficulty', e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded-full outline-none"
                          style={{
                            ...inputStyle,
                            color: q.difficulty ? DIFFICULTY_META[q.difficulty].color : textMuted,
                          }}
                        >
                          <option value="">Qualsiasi difficoltà</option>
                          {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
                            <option key={key} value={key}>{meta.label}</option>
                          ))}
                        </select>
                        {issues.length > 0 && (
                          <button
                            onClick={() => setCompleter([q.key])}
                            className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:underline text-left"
                          >
                            <AlertTriangle size={12} /> Incompleta ({issues.join(', ')}): non verrà usata in partita
                          </button>
                        )}
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: textMuted }}>Domanda</label>
                        <textarea
                          value={q.q}
                          onChange={(e) => updateQ(q.key, 'q', e.target.value)}
                          rows={2}
                          className="w-full mt-1 px-3 py-2 rounded-lg outline-none font-medium resize-none focus:ring-2"
                          style={inputStyle}
                          placeholder="Scrivi la domanda..."
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-3">
                          <label className={labelCls} style={{ color: '#10b981' }}>Risposta corretta</label>
                          <input
                            value={q.a}
                            onChange={(e) => updateQ(q.key, 'a', e.target.value)}
                            className="w-full mt-1 px-3 py-2 rounded-lg outline-none font-medium text-sm focus:ring-2"
                            style={{ ...inputStyle, border: `2px solid ${q.a.trim() ? '#10b981' : border}` }}
                            placeholder="Risposta corretta"
                          />
                        </div>
                        {q.wrong.map((w, wi) => (
                          <div key={wi}>
                            <label className={labelCls} style={{ color: '#ef4444' }}>Sbagliata {wi + 1}</label>
                            <input
                              value={w}
                              onChange={(e) => updateQ(q.key, 'wrong', e.target.value, wi)}
                              className="w-full mt-1 px-3 py-2 rounded-lg outline-none font-medium text-sm focus:ring-2"
                              style={{ ...inputStyle, border: `2px solid ${w.trim() ? '#ef444460' : border}` }}
                              placeholder={`Risposta sbagliata ${wi + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteQ(q.key)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      aria-label="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={addQ}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:opacity-90"
              style={{ background: current.color, color: '#fff', boxShadow: `0 6px 16px ${current.color}40` }}
            >
              <Plus size={18} /> Aggiungi domanda a {current.name || 'questo spicchio'}
            </button>
          </div>
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderTop: `1px solid ${border}`, background: bgSoft }}
        >
          <div className="flex items-center gap-1">
            <button onClick={handleExportBackup} className={smallBtnCls} style={{ color: textMuted }} title="Salva tutti gli spicchi in un file, per esempio per portarli su un altro PC">
              <Download size={16} /> Esporta backup
            </button>
            <button onClick={() => backupInputRef.current?.click()} className={smallBtnCls} style={{ color: textMuted }}>
              <Upload size={16} /> Carica backup
            </button>
            <input ref={backupInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportBackup} />
          </div>
          <div className="flex items-center gap-3">
            {toast ? (
              <span className={`flex items-center gap-1 font-semibold text-sm ${toast.warning ? 'text-amber-500' : 'text-emerald-500'}`}>
                {toast.warning ? <AlertTriangle size={16} /> : <Check size={16} />} {toast.text}
              </span>
            ) : (
              <span className="text-xs" style={{ color: textMuted }}>
                {storage === 'file' ? 'Le modifiche vengono salvate in dati/spicchi.json' : 'Le modifiche vengono salvate nel browser'}
              </span>
            )}
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold hover:opacity-95 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Save size={18} /> Salva tutte le modifiche
            </button>
          </div>
        </div>
      </div>

      {completer && (
        <QuestionCompleter
          keys={completer}
          questions={list}
          color={current.color}
          issuesOf={issuesOf}
          onChange={updateQ}
          onDelete={deleteQ}
          onClose={closeCompleter}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default QuestionEditor;
