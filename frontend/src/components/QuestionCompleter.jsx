import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { WRONG_COUNT } from '../utils/questionsTxt';

// Procedura guidata: chiede una domanda alla volta la risposta corretta (se manca)
// e le 3 risposte sbagliate. Lavora direttamente sulle domande dell'editor.
const QuestionCompleter = ({ keys, questions, color, issuesOf, onChange, onDelete, onClose }) => {
  const { isDark } = useTheme();
  const [pos, setPos] = useState(0);
  const firstInputRef = useRef(null);

  const items = keys.map((k) => questions.find((q) => q.key === k)).filter(Boolean);
  const index = Math.min(pos, items.length - 1);
  const q = items[index];
  const done = items.filter((it) => issuesOf(it).length === 0).length;

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (items.length === 0) onClose();
  }, [items.length, onClose]);

  if (!q) return null;

  const issues = issuesOf(q);
  const isLast = index === items.length - 1;
  const next = () => (isLast ? onClose() : setPos(index + 1));

  // Invio passa al campo successivo, e dall'ultimo alla domanda successiva
  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const inputs = [...e.currentTarget.closest('[data-completer]').querySelectorAll('input')];
    const i = inputs.indexOf(e.target);
    if (i < inputs.length - 1) inputs[i + 1].focus();
    else next();
  };

  const bg = isDark ? '#111a2e' : '#ffffff';
  const bgSoft = isDark ? '#1e293b' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputCls = 'w-full mt-1 px-3 py-2.5 rounded-lg outline-none font-medium focus:ring-2';
  const labelCls = 'text-[11px] font-bold uppercase tracking-wider';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        data-completer
        className="w-full max-w-xl rounded-3xl overflow-hidden"
        style={{ background: bg, color: textMain, boxShadow: '0 25px 60px rgba(0,0,0,0.45)', animation: 'popIn 300ms ease' }}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: color }}>
          <div className="text-white">
            <div className="text-xs font-semibold tracking-widest uppercase opacity-90">
              Completa le risposte · {done} di {items.length} complete
            </div>
            <div className="text-lg font-bold">Domanda {index + 1} di {items.length}</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>
        <div className="h-1.5" style={{ background: border }}>
          <div className="h-full transition-all" style={{ width: `${((index + 1) / items.length) * 100}%`, background: color }} />
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls} style={{ color: textMuted }}>Domanda</label>
            <textarea
              value={q.q}
              onChange={(e) => onChange(q.key, 'q', e.target.value)}
              rows={2}
              className={`${inputCls} resize-none text-lg font-semibold`}
              style={{ background: bgSoft, color: textMain, border: `1px solid ${border}` }}
            />
          </div>

          <div>
            <label className={labelCls} style={{ color: '#10b981' }}>Risposta corretta</label>
            <input
              ref={q.a ? undefined : firstInputRef}
              value={q.a}
              onChange={(e) => onChange(q.key, 'a', e.target.value)}
              onKeyDown={handleKeyDown}
              className={inputCls}
              style={{ background: bgSoft, color: textMain, border: `2px solid ${q.a.trim() ? '#10b981' : '#f59e0b'}` }}
              placeholder="Scrivi la risposta corretta..."
            />
          </div>

          <div>
            <label className={labelCls} style={{ color: '#ef4444' }}>
              Risposte sbagliate ({WRONG_COUNT})
            </label>
            <div className="space-y-2">
              {q.wrong.map((w, i) => (
                <input
                  key={i}
                  ref={q.a && i === 0 ? firstInputRef : undefined}
                  value={w}
                  onChange={(e) => onChange(q.key, 'wrong', e.target.value, i)}
                  onKeyDown={handleKeyDown}
                  className={inputCls}
                  style={{ background: bgSoft, color: textMain, border: `2px solid ${w.trim() ? '#ef444480' : border}` }}
                  placeholder={`Risposta sbagliata ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {issues.length > 0 ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
              <AlertTriangle size={16} /> Da completare: {issues.join(', ')}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
              <CheckCircle2 size={16} /> Domanda completa
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${border}`, background: bgSoft }}>
          <button
            onClick={() => {
              if (window.confirm('Eliminare questa domanda?')) onDelete(q.key);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={16} /> Elimina
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPos(index - 1)}
              disabled={index === 0}
              className="flex items-center gap-1 px-3 py-2 rounded-xl font-semibold text-sm disabled:opacity-40"
              style={{ color: textMuted }}
            >
              <ChevronLeft size={18} /> Indietro
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-white font-bold"
              style={{ background: color }}
            >
              {isLast ? <><Check size={18} /> Fine</> : <>Avanti <ChevronRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCompleter;
