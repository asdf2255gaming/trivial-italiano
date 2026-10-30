import React, { useState } from 'react';
import { Users, Plus, Minus, Play, UserRound, Timer, Infinity as InfinityIcon, GraduationCap, Dices, Flame, History, Trash2, Flag, Target } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GAME_MODES, END_RULES, TARGET_PRESETS, DEFAULT_TARGET, MIN_TARGET, MAX_TARGET } from '../data/questions';
import { endRuleSummary } from './RulesModal';

// Un colore ben distinguibile per ogni giocatore (o squadra)
const PLAYER_COLORS = [
  '#8B5CF6', '#F43F5E', '#06B6D4', '#F97316', '#10B981',
  '#EAB308', '#2563EB', '#D946EF', '#84CC16', '#92400E',
];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = PLAYER_COLORS.length;
const DEFAULT_NAMES = PLAYER_COLORS.map((_, i) => `Giocatore ${i + 1}`);
const TIMER_OPTIONS = [
  { value: 0, label: 'Illimitato', icon: InfinityIcon },
  { value: 15, label: '15 sec' },
  { value: 20, label: '20 sec' },
  { value: 30, label: '30 sec' },
  { value: 45, label: '45 sec' },
];
const MODE_ICON = { GraduationCap, Dices, Flame };
const END_ICON = { wheel: Flag, points: Target };

const PlayerSetup = ({ onStart, savedGame, onResume, onDiscard }) => {
  const { isDark } = useTheme();
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [modeId, setModeId] = useState('classic');
  const [timer, setTimer] = useState(GAME_MODES.classic.defaultTimer);
  const [endRule, setEndRule] = useState('wheel');
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const targetValid = Number.isInteger(target) && target >= MIN_TARGET && target <= MAX_TARGET;

  const updateName = (i, value) => {
    const copy = [...names];
    copy[i] = value;
    setNames(copy);
  };

  const handleModeChange = (id) => {
    setModeId(id);
    setTimer(GAME_MODES[id].defaultTimer);
  };

  const handleStart = () => {
    if (endRule === 'points' && !targetValid) return;
    if (savedGame && !window.confirm('Iniziando una nuova partita, quella salvata verrà persa. Continuare?')) return;
    const players = Array.from({ length: count }).map((_, i) => ({
      id: `p${i}`,
      name: names[i]?.trim() || DEFAULT_NAMES[i],
      color: PLAYER_COLORS[i],
      wedges: [],
      points: 0,
    }));
    onStart(players, timer, modeId, { type: endRule, target: endRule === 'points' ? target : null });
  };

  const bgPage = isDark
    ? 'radial-gradient(ellipse at top left, #1e1b4b 0%, transparent 50%), radial-gradient(ellipse at bottom right, #0f172a 0%, transparent 50%), linear-gradient(135deg, #0b1120 0%, #111827 100%)'
    : 'radial-gradient(ellipse at top left, #fef3c7 0%, transparent 50%), radial-gradient(ellipse at bottom right, #ddd6fe 0%, transparent 50%), linear-gradient(135deg, #fdfbf7 0%, #f5f3ff 100%)';
  const panel = isDark ? '#111a2e' : '#ffffff';
  const soft = isDark ? '#1e293b' : '#f1f5f9';
  const softLight = isDark ? '#1e293b' : '#f8fafc';
  const textMain = isDark ? '#e2e8f0' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: bgPage }}>
      <div
        className="w-full max-w-3xl rounded-3xl p-7 md:p-9"
        style={{
          background: panel,
          color: textMain,
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          fontFamily: 'Fredoka, Poppins, sans-serif',
        }}
      >
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}
          >
            <Users size={26} color="#fff" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-1">
            Prepariamo la{' '}
            <span style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              partita
            </span>
          </h1>
          <p className="text-sm" style={{ color: textMuted }}>Scegli modalità, giocatori e tempo</p>
        </div>

        {/* Partita salvata da riprendere */}
        {savedGame && (
          <div
            className="mb-6 rounded-2xl p-4 border-2 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ borderColor: '#8B5CF6', background: '#8B5CF615' }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center gap-2">
                <History size={18} color="#8B5CF6" /> Partita in corso
                <span className="text-xs font-semibold" style={{ color: textMuted }}>
                  turno #{(savedGame.turnCount || 0) + 1}
                  {savedGame.endRule?.type === 'points' ? ` · obiettivo ${savedGame.endRule.target} punti` : ' · fino alla ruota completa'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-sm">
                {savedGame.players.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    {p.name}
                    <span className="text-xs" style={{ color: textMuted }}>({p.points || 0} pt)</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  if (window.confirm('Eliminare la partita salvata?')) onDiscard();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={16} /> Elimina
              </button>
              <button
                onClick={onResume}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold"
                style={{ background: '#8B5CF6', boxShadow: '0 6px 16px rgba(139, 92, 246, 0.35)' }}
              >
                <Play size={16} fill="#fff" /> Riprendi
              </button>
            </div>
          </div>
        )}

        {/* Game mode selector */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textMuted }}>
            Modalità di gioco
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.values(GAME_MODES).map((mode) => {
              const Icon = MODE_ICON[mode.icon];
              const active = modeId === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className="p-4 rounded-2xl text-left border-2 transition-all hover:scale-[1.02]"
                  style={{
                    background: active ? `${mode.color}15` : softLight,
                    borderColor: active ? mode.color : 'transparent',
                    boxShadow: active ? `0 10px 25px ${mode.color}30` : 'none',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ background: mode.color, color: '#fff' }}
                  >
                    {Icon && <Icon size={20} />}
                  </div>
                  <div className="font-bold text-sm mb-1" style={{ color: textMain }}>
                    {mode.name}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: textMuted }}>
                    {mode.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Players count */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <button
            onClick={() => setCount(Math.max(MIN_PLAYERS, count - 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
            style={{ background: soft }}
            disabled={count <= MIN_PLAYERS}
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <div className="text-5xl font-black">{count}</div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: textMuted }}>giocatori o squadre</div>
          </div>
          <button
            onClick={() => setCount(Math.min(MAX_PLAYERS, count + 1))}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
            style={{ background: soft }}
            disabled={count >= MAX_PLAYERS}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-3 py-2 border-2 border-transparent focus-within:border-slate-400 transition-colors"
              style={{ background: softLight }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: PLAYER_COLORS[i] }}>
                <UserRound size={18} color="#fff" />
              </div>
              <input
                value={names[i]}
                onChange={(e) => updateName(i, e.target.value)}
                className="flex-1 bg-transparent outline-none font-semibold"
                style={{ color: textMain }}
                placeholder={DEFAULT_NAMES[i]}
                maxLength={18}
              />
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-2.5">
            <Timer size={16} style={{ color: textMuted }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: textMuted }}>
              Tempo per rispondere
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMER_OPTIONS.map((opt) => {
              const active = timer === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTimer(opt.value)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: active ? '#ec4899' : soft,
                    color: active ? '#fff' : textMain,
                    boxShadow: active ? '0 6px 16px rgba(236, 72, 153, 0.35)' : 'none',
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine della partita */}
        <div className="mb-7">
          <div className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: textMuted }}>
            Fine della partita
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(END_RULES).map((rule) => {
              const Icon = END_ICON[rule.id];
              const active = endRule === rule.id;
              return (
                <button
                  key={rule.id}
                  onClick={() => setEndRule(rule.id)}
                  className="p-4 rounded-2xl text-left border-2 transition-all flex gap-3"
                  style={{
                    background: active ? '#ec489915' : softLight,
                    borderColor: active ? '#ec4899' : 'transparent',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: active ? '#ec4899' : soft, color: active ? '#fff' : textMuted }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: textMain }}>{rule.name}</div>
                    <div className="text-xs leading-snug mt-0.5" style={{ color: textMuted }}>{rule.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {endRule === 'points' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold mr-1" style={{ color: textMain }}>Punti da raggiungere:</span>
              {TARGET_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => setTarget(v)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: target === v ? '#ec4899' : soft,
                    color: target === v ? '#fff' : textMain,
                  }}
                >
                  {v}
                </button>
              ))}
              <input
                type="number"
                min={MIN_TARGET}
                max={MAX_TARGET}
                step={10}
                value={Number.isNaN(target) ? '' : target}
                onChange={(e) => setTarget(e.target.value === '' ? NaN : Math.round(Number(e.target.value)))}
                className="w-24 px-3 py-2 rounded-xl outline-none font-semibold text-sm focus:ring-2"
                style={{ background: soft, color: textMain, border: `2px solid ${targetValid ? 'transparent' : '#ef4444'}` }}
                aria-label="Punti da raggiungere"
              />
              {!targetValid && (
                <span className="text-xs font-semibold text-red-500">
                  Inserisci un numero tra {MIN_TARGET} e {MAX_TARGET}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={endRule === 'points' && !targetValid}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 hover:opacity-95 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
            boxShadow: '0 10px 25px rgba(236, 72, 153, 0.35)',
          }}
        >
          <Play size={22} fill="#fff" />
          Inizia la partita
        </button>

        <p className="text-center text-xs mt-4" style={{ color: textMuted }}>
          {endRuleSummary({ type: endRule, target: targetValid ? target : null })}
        </p>
      </div>
    </div>
  );
};

export default PlayerSetup;
