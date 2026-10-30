import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, XCircle, Timer as TimerIcon, Check, Sprout, Zap, Flame, AlertTriangle } from 'lucide-react';
import { playSuccess, playWrong } from '../utils/sound';
import CountdownRing from './CountdownRing';
import { useTheme } from '../contexts/ThemeContext';
import { DIFFICULTY_META, SCORING } from '../data/questions';
import { getCategoryIcon } from '../data/icons';
const diffIconMap = { Sprout, Zap, Flame };

// Fisher-Yates shuffle (returns new array)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const QuestionModal = ({ category, question, player, onResolve, canEarnWedge, alreadyOwned, timerSec = 0 }) => {
  const { isDark } = useTheme();
  const fallback = { q: 'Nessuna domanda disponibile.', a: '—', options: ['—', '—', '—', '—'] };
  const current = question || fallback;

  const shuffledOptions = useMemo(
    () => shuffle(current.options || []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current]
  );

  const [picked, setPicked] = useState(null);
  const [resolved, setResolved] = useState(null); // 'correct' | 'wrong'
  const [timedOut, setTimedOut] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const Icon = getCategoryIcon(category.icon);

  // Esc chiede conferma prima di chiudere; un secondo Esc annulla la richiesta
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !resolved) setConfirmClose((open) => !open);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resolved]);

  const finish = (correct) => {
    if (resolved) return;
    setResolved(correct ? 'correct' : 'wrong');
    if (correct) playSuccess();
    else playWrong();
    setTimeout(() => onResolve(correct), 1500);
  };

  const handlePick = (option) => {
    if (picked || resolved || timedOut) return;
    setPicked(option);
    const correct = option === current.a;
    finish(correct);
  };

  const handleExpire = () => {
    if (resolved) return;
    setTimedOut(true);
    finish(false);
  };

  const bg = isDark ? '#111a2e' : '#ffffff';
  const bgSoft = isDark ? '#1e293b' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  const optionStyle = (option) => {
    const isPicked = picked === option;
    const isCorrect = option === current.a;
    const showResult = !!resolved || timedOut;
    let bgCol = isDark ? '#1e293b' : '#f8fafc';
    let borderCol = border;
    let colorCol = textMain;

    if (showResult) {
      if (isCorrect) {
        bgCol = '#10b98120';
        borderCol = '#10b981';
        colorCol = isDark ? '#6ee7b7' : '#047857';
      } else if (isPicked && !isCorrect) {
        bgCol = '#ef444420';
        borderCol = '#ef4444';
        colorCol = isDark ? '#fca5a5' : '#b91c1c';
      } else {
        bgCol = isDark ? '#1e293b80' : '#f1f5f980';
      }
    }
    return { background: bgCol, borderColor: borderCol, color: colorCol };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 250ms ease',
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: bg,
          color: textMain,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'popIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: 'Fredoka, Poppins, sans-serif',
        }}
      >
        {confirmClose && !resolved && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
            style={{ background: isDark ? 'rgba(17, 26, 46, 0.94)' : 'rgba(255, 255, 255, 0.95)' }}
          >
            <div className="text-center max-w-sm">
              <AlertTriangle size={40} className="mx-auto mb-3 text-amber-500" />
              <h3 className="text-xl font-bold mb-1" style={{ color: textMain }}>Chiudere la domanda?</h3>
              <p className="text-sm mb-5" style={{ color: textMuted }}>
                Verrà considerata una risposta sbagliata e il turno passerà al prossimo giocatore.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  autoFocus
                  onClick={() => setConfirmClose(false)}
                  className="px-4 py-2.5 rounded-xl font-bold"
                  style={{ background: bgSoft, color: textMain, border: `1px solid ${border}` }}
                >
                  Torna alla domanda
                </button>
                <button
                  onClick={() => onResolve(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-white"
                  style={{ background: '#ef4444' }}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <Icon size={28} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-white text-xs font-semibold tracking-widest uppercase opacity-90">Categoria</div>
              <h2 className="text-white text-2xl font-bold">{category.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {timerSec > 0 && !resolved && !timedOut && (
              <CountdownRing duration={timerSec} onExpire={handleExpire} color="#ffffff" />
            )}
            {!resolved && (
              <button
                onClick={() => setConfirmClose(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Chiudi"
              >
                <X size={22} />
              </button>
            )}
          </div>
        </div>

        {player && (
          <div
            className="px-8 py-3 flex items-center gap-2"
            style={{ background: `${player.color}15`, borderBottom: `1px solid ${border}` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: player.color }} />
            <span className="text-sm font-semibold" style={{ color: textMain }}>
              Turno di <span style={{ color: player.color }}>{player.name}</span>
            </span>
            {alreadyOwned && (
              <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Cuneo già vinto
              </span>
            )}
          </div>
        )}

        <div className="px-8 py-7">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: category.color }}>
              Domanda
            </div>
            {current.difficulty && DIFFICULTY_META[current.difficulty] && (() => {
              const meta = DIFFICULTY_META[current.difficulty];
              const DiffIcon = diffIconMap[meta.icon];
              return (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: `${meta.color}20`, color: meta.color }}
                >
                  {DiffIcon && <DiffIcon size={12} />}
                  {meta.label}
                </div>
              );
            })()}
          </div>
          <p className="text-xl md:text-2xl font-semibold leading-snug mb-6" style={{ color: textMain }}>
            {current.q}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledOptions.map((option, i) => {
              const showResult = !!resolved || timedOut;
              const isCorrect = option === current.a;
              const isPicked = picked === option;
              return (
                <button
                  key={i}
                  onClick={() => handlePick(option)}
                  disabled={showResult}
                  className="group relative text-left px-4 py-3 rounded-xl border-2 font-semibold transition-all disabled:cursor-default"
                  style={{
                    ...optionStyle(option),
                    transform: !showResult ? 'translateY(0)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (showResult) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = category.color;
                  }}
                  onMouseLeave={(e) => {
                    if (showResult) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = border;
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0"
                      style={{
                        background: showResult && isCorrect
                          ? '#10b981'
                          : showResult && isPicked
                          ? '#ef4444'
                          : category.color + '20',
                        color: showResult && (isCorrect || isPicked) ? '#fff' : category.color,
                      }}
                    >
                      {showResult && isCorrect ? <Check size={16} /> :
                       showResult && isPicked ? <X size={16} /> :
                       String.fromCharCode(65 + i)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-8 py-4" style={{ borderTop: `1px solid ${border}`, background: bgSoft }}>
          {timedOut ? (
            <div className="text-center py-1 font-bold text-lg flex items-center justify-center gap-2 text-red-500">
              <TimerIcon size={22} /> Tempo scaduto! La risposta era: <span className="underline">{current.a}</span>
            </div>
          ) : resolved === 'correct' ? (
            <div className="text-center py-1 font-bold text-lg flex items-center justify-center gap-2" style={{ color: '#10b981' }}>
              <CheckCircle2 size={22} />
              {canEarnWedge ? `Corretto! +${SCORING.correct} punti e cuneo guadagnato!` : `Corretto! +${SCORING.correct} punti`}
            </div>
          ) : resolved === 'wrong' ? (
            <div className="text-center py-1 font-bold text-lg flex items-center justify-center gap-2" style={{ color: '#ef4444' }}>
              <XCircle size={22} /> Sbagliato — la risposta era: <span className="underline">{current.a}</span>
            </div>
          ) : (
            <p className="text-center text-sm" style={{ color: textMuted }}>
              Scegli una delle quattro opzioni per rispondere
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default QuestionModal;
