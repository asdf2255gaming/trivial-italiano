import React, { useState, useRef, useMemo, useEffect } from 'react';
import TrivialWheel from '../components/TrivialWheel';
import QuestionModal from '../components/QuestionModal';
import PlayerSetup from '../components/PlayerSetup';
import PlayerPanel from '../components/PlayerPanel';
import QuestionEditor from '../components/QuestionEditor';
import DifficultyPicker from '../components/DifficultyPicker';
import RulesModal from '../components/RulesModal';
import { useQuestions } from '../hooks/useQuestions';
import { useTheme } from '../contexts/ThemeContext';
import { GAME_MODES, DIFFICULTY_META, SCORING, MIN_TARGET } from '../data/questions';
import { Share2, Maximize2, Zap, RotateCcw, Crown, Trophy, Sun, Moon, PenLine, Download, GraduationCap, Dices, Flame, Flag, Target, BookOpen } from 'lucide-react';
import { playSpinTicks, playChime } from '../utils/sound';
import { isPlayable } from '../utils/questionsTxt';
import html2canvas from 'html2canvas';

const SPIN_DURATION = 4000;
const MODE_ICON = { GraduationCap, Dices, Flame };
const GAME_KEY = 'trivial-partita-v1';

// Partita in corso salvata nel browser (giocatori, cunei, turno, domande già uscite)
const loadSavedGame = () => {
  try {
    const g = JSON.parse(localStorage.getItem(GAME_KEY));
    if (g && Array.isArray(g.players) && g.players.length >= 2) return g;
  } catch {}
  return null;
};

const clearSavedGame = () => {
  try {
    localStorage.removeItem(GAME_KEY);
  } catch {}
};

const TrivialGame = () => {
  const { categories: allCategories, saveCategories, storage } = useQuestions();
  // Sulla ruota vanno solo gli spicchi che hanno almeno una domanda giocabile
  const categories = useMemo(
    () => allCategories.filter((c) => c.questions.some(isPlayable)),
    [allCategories]
  );
  const { isDark, toggle: toggleTheme } = useTheme();

  const [players, setPlayers] = useState(null);
  const [timerSec, setTimerSec] = useState(20);
  const [modeId, setModeId] = useState('classic');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pendingCategory, setPendingCategory] = useState(null); // waiting for difficulty pick
  const [activeQuestion, setActiveQuestion] = useState(null); // { category, question }
  const [winner, setWinner] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Domande già uscite in questa partita, per spicchio: { [catId]: [testo domanda, ...] }
  const [used, setUsed] = useState({});
  const [savedGame, setSavedGame] = useState(loadSavedGame);
  // Regola di fine partita scelta all'inizio: { type: 'wheel' } oppure { type: 'points', target }
  const [endRule, setEndRule] = useState({ type: 'wheel', target: null });
  // Chi ha fatto scattare la fine (ruota completa o punteggio raggiunto): da lì si finisce il giro
  const [closerId, setCloserId] = useState(null);
  // Chi ha completato per primo la ruota e preso il bonus (in modalità ruota coincide con closerId)
  const [wheelBonusId, setWheelBonusId] = useState(null);

  const spinLockRef = useRef(false);
  const resultsRef = useRef(null);

  const mode = GAME_MODES[modeId] || GAME_MODES.classic;
  const ownedCount = (p) => categories.filter((c) => p.wedges.includes(c.id)).length;
  const hasAllWedges = (p) => categories.length > 0 && categories.every((c) => p.wedges.includes(c.id));

  // Classifica: più punti, poi più spicchi, poi chi ha chiuso la ruota
  const rankPlayers = (list) =>
    [...list].sort(
      (a, b) =>
        (b.points || 0) - (a.points || 0) ||
        ownedCount(b) - ownedCount(a) ||
        (b.id === closerId) - (a.id === closerId)
    );

  const reachedTarget = (p) => endRule.type === 'points' && (p.points || 0) >= endRule.target;

  // Se un giocatore completa la ruota per effetto di modifiche dall'editor, prende il bonus
  // (e in modalità ruota fa scattare l'ultimo giro)
  useEffect(() => {
    if (!players || winner || wheelBonusId) return;
    const completer = players.find(hasAllWedges);
    if (!completer) return;
    const updated = players.map((p) => (p.id === completer.id ? { ...p, points: (p.points || 0) + SCORING.closeBonus } : p));
    setWheelBonusId(completer.id);
    if (!closerId && (endRule.type === 'wheel' || reachedTarget(updated.find((p) => p.id === completer.id)))) {
      setCloserId(completer.id);
    }
    setPlayers(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, categories, winner, wheelBonusId]);

  // Salva la partita a ogni cambiamento; a partita finita la cancella
  useEffect(() => {
    if (!players) return;
    if (winner) {
      clearSavedGame();
      return;
    }
    try {
      localStorage.setItem(
        GAME_KEY,
        JSON.stringify({ players, timerSec, modeId, currentPlayerIdx, turnCount, used, closerId, wheelBonusId, endRule, savedAt: new Date().toISOString() })
      );
    } catch {}
  }, [players, timerSec, modeId, currentPlayerIdx, turnCount, used, closerId, wheelBonusId, endRule, winner]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const spin = () => {
    if (isSpinning || spinLockRef.current || winner || pendingCategory || activeQuestion || showRules) return;
    if (categories.length < 2) return;
    spinLockRef.current = true;
    setIsSpinning(true);

    const idx = Math.floor(Math.random() * categories.length);
    const slice = 360 / categories.length;
    const sliceMid = idx * slice + slice / 2;
    const curMod = ((rotation % 360) + 360) % 360;
    const target = (360 - sliceMid) % 360;
    const needed = (target - curMod + 720) % 360;
    const delta = 6 * 360 + needed;
    setRotation(rotation + delta);
    playSpinTicks(SPIN_DURATION);

    setTimeout(() => {
      playChime(880);
      setIsSpinning(false);
      spinLockRef.current = false;
      const chosen = categories[idx];
      // La scelta della difficoltà ha senso solo se lo spicchio ha domande con difficoltà
      if (mode.pickOnEachTurn && chosen.questions.some((q) => isPlayable(q) && q.difficulty)) {
        setPendingCategory(chosen);
      } else {
        pickQuestionAndStart(chosen, mode.allowedDifficulties);
      }
    }, SPIN_DURATION + 100);
  };

  // Pesca una domanda giocabile della difficoltà ammessa (o una qualsiasi se non ce ne sono),
  // escludendo quelle già uscite nella partita. Esaurite tutte, il mazzo dello spicchio si rimescola.
  const pickQuestionAndStart = (cat, allowedDiffs) => {
    const playable = cat.questions.filter(isPlayable);
    const pool = playable.filter(
      (q) => !q.difficulty || allowedDiffs.includes(q.difficulty)
    );
    const source = pool.length > 0 ? pool : playable;
    let usedHere = used[cat.id] || [];
    let fresh = source.filter((q) => !usedHere.includes(q.q));
    if (fresh.length === 0) {
      const sourceTexts = new Set(source.map((q) => q.q));
      usedHere = usedHere.filter((t) => !sourceTexts.has(t));
      fresh = source;
    }
    const q = fresh[Math.floor(Math.random() * fresh.length)];
    setUsed((prev) => ({ ...prev, [cat.id]: [...usedHere, q.q] }));
    setActiveQuestion({ category: cat, question: q });
  };

  const handleDifficultyPick = (diff) => {
    const cat = pendingCategory;
    setPendingCategory(null);
    if (!cat) return;
    pickQuestionAndStart(cat, [diff]);
  };

  const handleResolve = (correct) => {
    const cat = activeQuestion?.category;
    setActiveQuestion(null);
    if (!cat) return;

    let updatedPlayers = players;
    let closer = closerId;

    if (correct) {
      // Ogni risposta giusta vale punti, anche su uno spicchio già vinto
      updatedPlayers = players.map((p, i) => {
        if (i !== currentPlayerIdx) return p;
        const wedges = p.wedges.includes(cat.id) ? p.wedges : [...p.wedges, cat.id];
        return { ...p, wedges, points: (p.points || 0) + SCORING.correct };
      });
      let me = updatedPlayers[currentPlayerIdx];
      if (!wheelBonusId && hasAllWedges(me)) {
        // Primo a completare la ruota: bonus
        updatedPlayers = updatedPlayers.map((p) =>
          p.id === me.id ? { ...p, points: p.points + SCORING.closeBonus } : p
        );
        me = updatedPlayers[currentPlayerIdx];
        setWheelBonusId(me.id);
        if (endRule.type === 'wheel' && !closer) closer = me.id;
      }
      // Modalità punteggio: il primo che arriva all'obiettivo fa scattare l'ultimo giro
      if (!closer && reachedTarget(me)) closer = me.id;
      if (closer !== closerId) setCloserId(closer);
      setPlayers(updatedPlayers);
    }

    const nextIdx = (currentPlayerIdx + 1) % players.length;
    // Il giro finisce quando si torna al primo giocatore: così tutti hanno giocato gli stessi turni
    if (closer && nextIdx === 0) {
      setWinner(rankPlayers(updatedPlayers)[0]);
      return;
    }
    setCurrentPlayerIdx(nextIdx);
    setTurnCount((t) => t + 1);
  };

  const handleReset = () => {
    if (players && !winner && !window.confirm('Iniziare una nuova partita? Quella in corso verrà persa.')) return;
    clearSavedGame();
    setSavedGame(null);
    setUsed({});
    setCloserId(null);
    setWheelBonusId(null);
    setPlayers(null);
    setCurrentPlayerIdx(0);
    setRotation(0);
    setIsSpinning(false);
    setPendingCategory(null);
    setActiveQuestion(null);
    setWinner(null);
    setTurnCount(0);
  };

  const handleExportResults = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: isDark ? '#0b1120' : '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `trivial-italiano-risultati-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setExporting(false);
    }
  };

  const resumeGame = () => {
    const g = savedGame;
    if (!g) return;
    setPlayers(g.players);
    setTimerSec(typeof g.timerSec === 'number' ? g.timerSec : 20);
    setModeId(GAME_MODES[g.modeId] ? g.modeId : 'classic');
    setCurrentPlayerIdx(Math.min(g.currentPlayerIdx || 0, g.players.length - 1));
    setTurnCount(g.turnCount || 0);
    setUsed(g.used && typeof g.used === 'object' ? g.used : {});
    setCloserId(g.closerId || null);
    setWheelBonusId(g.wheelBonusId ?? (g.endRule ? null : g.closerId || null));
    setEndRule(g.endRule?.type === 'points' && g.endRule.target >= MIN_TARGET ? g.endRule : { type: 'wheel', target: null });
    setWinner(null);
    setSavedGame(null);
  };

  if (!players) {
    return (
      <>
        <TopThemeButton isDark={isDark} toggleTheme={toggleTheme} onEditor={() => setShowEditor(true)} />
        <PlayerSetup
          savedGame={savedGame}
          onResume={resumeGame}
          onDiscard={() => {
            clearSavedGame();
            setSavedGame(null);
          }}
          onStart={(p, t, m, rule) => {
            setUsed({});
            setCloserId(null);
            setWheelBonusId(null);
            setEndRule(rule || { type: 'wheel', target: null });
            setShowRules(true);
            setCurrentPlayerIdx(0);
            setTurnCount(0);
            setSavedGame(null);
            setPlayers(p);
            setTimerSec(t);
            setModeId(m || 'classic');
          }}
        />
        {showEditor && (
          <QuestionEditor
            categories={allCategories}
            onSave={saveCategories}
            storage={storage}
            onClose={() => setShowEditor(false)}
          />
        )}
      </>
    );
  }

  const activePlayer = winner || players[currentPlayerIdx];
  const closer = players.find((p) => p.id === closerId);
  const ranking = rankPlayers(players);
  const tiedWinners = winner
    ? ranking.filter((p) => (p.points || 0) === (winner.points || 0) && ownedCount(p) === ownedCount(winner) && (p.id === closerId) === (winner.id === closerId))
    : [];
  const turnsLeft = closer ? players.length - currentPlayerIdx : 0;
  const alreadyOwned = activeQuestion
    ? players[currentPlayerIdx].wedges.includes(activeQuestion.category.id)
    : false;

  const pageBg = isDark
    ? 'radial-gradient(ellipse at top left, #1e1b4b 0%, transparent 50%), radial-gradient(ellipse at bottom right, #0f172a 0%, transparent 50%), linear-gradient(135deg, #0b1120 0%, #111827 100%)'
    : 'radial-gradient(ellipse at top left, #fef3c7 0%, transparent 50%), radial-gradient(ellipse at bottom right, #ddd6fe 0%, transparent 50%), linear-gradient(135deg, #fdfbf7 0%, #f5f3ff 100%)';
  const barBg = isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)';
  const barColor = isDark ? '#e2e8f0' : '#475569';
  const barHover = isDark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(255, 255, 255, 1)';
  const titleColor = isDark ? '#f1f5f9' : '#1e293b';
  const subColor = isDark ? '#94a3b8' : '#475569';

  const ModeIcon = MODE_ICON[mode.icon];

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{ background: pageBg, fontFamily: 'Fredoka, Poppins, sans-serif', color: titleColor }}
    >
      <div className={`absolute top-10 left-10 w-24 h-24 rounded-full blur-2xl ${isDark ? 'bg-violet-900/40' : 'bg-pink-200/40'}`} />
      <div className={`absolute bottom-20 right-16 w-36 h-36 rounded-full blur-3xl ${isDark ? 'bg-blue-900/40' : 'bg-blue-200/40'}`} />
      <div className={`absolute top-1/3 right-10 w-20 h-20 rounded-full blur-2xl ${isDark ? 'bg-amber-900/30' : 'bg-yellow-200/50'}`} />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>T</div>
          <span className="font-bold text-lg" style={{ color: titleColor }}>Trivial Italiano</span>
          {/* Mode badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: `${mode.color}20`, color: mode.color }}
          >
            {ModeIcon && <ModeIcon size={12} />}
            {mode.name}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <TopBarBtn onClick={() => setShowRules(true)} bg={barBg} color={barColor} hover={barHover}>
            <BookOpen size={16} /> Regole
          </TopBarBtn>
          <TopBarBtn onClick={() => setShowEditor(true)} bg={barBg} color={barColor} hover={barHover}>
            <PenLine size={16} /> Editor
          </TopBarBtn>
          <TopBarBtn onClick={handleReset} bg={barBg} color={barColor} hover={barHover}>
            <RotateCcw size={16} /> Nuova partita
          </TopBarBtn>
          <TopBarBtn onClick={toggleTheme} bg={barBg} color={barColor} hover={barHover} title="Cambia tema">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Chiaro' : 'Scuro'}
          </TopBarBtn>
          <TopBarBtn onClick={handleFullscreen} bg={barBg} color={barColor} hover={barHover}>
            <Maximize2 size={16} /> Schermo intero
          </TopBarBtn>
          <TopBarBtn onClick={() => navigator.clipboard?.writeText(window.location.href)} bg={barBg} color={barColor} hover={barHover}>
            <Share2 size={16} /> Condividi
          </TopBarBtn>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-16 pt-2">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-start">
          <div className="flex flex-col items-center">
            <div className="text-center max-w-2xl mb-6">
              <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight" style={{ letterSpacing: '-0.02em', color: titleColor }}>
                TRIVIAL{' '}
                <span style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  interattivo
                </span>
              </h1>
              <p className="text-base md:text-lg" style={{ color: subColor }}>
                {winner
                  ? 'La partita è finita!'
                  : <>Turno di <span style={{ color: activePlayer.color }} className="font-bold">{activePlayer.name}</span> — fai girare la ruota!</>
                }
              </p>
              {closer && !winner && (
                <div
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: `${closer.color}20`, color: closer.color }}
                >
                  {endRule.type === 'points' ? <Target size={16} /> : <Flag size={16} />}
                  {endRule.type === 'points'
                    ? `${closer.name} ha raggiunto ${endRule.target} punti`
                    : `${closer.name} ha completato la ruota (+${SCORING.closeBonus})`}
                  {' '}· ultimo giro: {turnsLeft === 1 ? 'resta 1 turno' : `restano ${turnsLeft} turni`}
                </div>
              )}
            </div>

            <TrivialWheel
              categories={categories}
              rotation={rotation}
              isSpinning={isSpinning}
              onSliceClick={null}
              spinDuration={SPIN_DURATION}
            />

            <button
              onClick={spin}
              disabled={isSpinning || !!winner || !!activeQuestion || !!pendingCategory || categories.length < 2}
              className="mt-8 flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-black text-xl hover:scale-[1.03] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isSpinning ? '#94a3b8' : `linear-gradient(135deg, ${activePlayer.color}, ${activePlayer.color}cc)`,
                boxShadow: `0 12px 28px ${activePlayer.color}50`,
              }}
            >
              <Zap size={24} fill="#fff" />
              {isSpinning ? 'Gira...' : winner ? 'Partita conclusa' : 'GIRA LA RUOTA'}
            </button>

            {categories.length < 2 && (
              <p className="mt-4 text-sm font-semibold text-red-500 text-center">
                Servono almeno 2 spicchi con domande complete: aprili nell'Editor.
              </p>
            )}

            <div className="mt-5 text-xs flex items-center gap-3 flex-wrap justify-center" style={{ color: subColor }}>
              <span className="flex items-center gap-1"><Trophy size={14} /> Turno #{turnCount + 1}</span>
              <span className="flex items-center gap-1 font-semibold">
                {endRule.type === 'points'
                  ? <><Target size={14} /> Obiettivo: {endRule.target} punti</>
                  : <><Flag size={14} /> Fino alla ruota completa</>}
              </span>
              {timerSec > 0 && <span>⏱ {timerSec}s per risposta</span>}
              {!mode.pickOnEachTurn && mode.allowedDifficulties.length === 1 && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: `${DIFFICULTY_META[mode.allowedDifficulties[0]].color}20`,
                    color: DIFFICULTY_META[mode.allowedDifficulties[0]].color,
                  }}
                >
                  Solo {DIFFICULTY_META[mode.allowedDifficulties[0]].label}
                </span>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 w-full lg:w-auto flex justify-center">
            <PlayerPanel players={players} currentPlayerIdx={currentPlayerIdx} categories={categories} winner={winner} closerId={closerId} />
          </div>
        </div>
      </main>

      {winner && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', animation: 'fadeIn 300ms ease' }}
        >
          <div
            className="rounded-3xl p-8 max-w-md w-full max-h-[92vh] overflow-y-auto"
            style={{
              background: isDark ? '#111a2e' : '#ffffff',
              color: titleColor,
              boxShadow: `0 25px 60px ${winner.color}60`,
              animation: 'popIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div ref={resultsRef} style={{ padding: '24px', background: isDark ? '#111a2e' : '#ffffff', borderRadius: '20px' }}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${winner.color}, ${winner.color}cc)` }}>
                  <Crown size={44} color="#fff" fill="#fff" />
                </div>
                <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: subColor }}>
                  {tiedWinners.length > 1 ? 'Pari merito' : 'Vincitore'}
                </div>
                <h2 className="text-4xl font-black mb-1" style={{ color: titleColor }}>
                  {tiedWinners.length > 1 ? tiedWinners.map((p) => p.name).join(' e ') : winner.name}
                </h2>
                <p className="text-sm mb-2" style={{ color: subColor }}>
                  Con {winner.points || 0} punti
                  {closer && closer.id !== winner.id && (
                    endRule.type === 'points'
                      ? <> · i {endRule.target} punti li ha raggiunti per primo {closer.name}</>
                      : <> · la ruota l'ha chiusa {closer.name}</>
                  )}
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-4" style={{ background: `${mode.color}20`, color: mode.color }}>
                  Modalità {mode.name}
                </div>
              </div>
              <div className="space-y-2">
                {ranking.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: isDark ? '#1e293b' : '#f8fafc' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm" style={{ background: p.color }}>{i + 1}</div>
                    <div className="flex-1 font-bold flex items-center gap-1.5 min-w-0" style={{ color: titleColor }}>
                      <span className="truncate">{p.name}</span>
                      {p.id === closerId && <Flag size={14} color={p.color} title="Ha chiuso la ruota" />}
                    </div>
                    <div className="flex gap-1">
                      {categories.map((cat) => (
                        <div key={cat.id} className="w-3 h-3 rounded-full" style={{ background: p.wedges.includes(cat.id) ? cat.color : (isDark ? '#334155' : '#e2e8f0') }} />
                      ))}
                    </div>
                    <div className="text-sm font-bold w-10 text-right" style={{ color: subColor }}>{ownedCount(p)}/{categories.length}</div>
                    <div className="text-base font-black w-14 text-right" style={{ color: titleColor }}>{p.points || 0} pt</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-5 text-xs" style={{ color: subColor }}>
                Trivial Italiano · {new Date().toLocaleDateString('it-IT')}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleExportResults}
                disabled={exporting}
                className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-95 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)' }}
              >
                <Download size={18} /> {exporting ? 'Esporto...' : 'Salva PNG'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl text-white font-bold hover:opacity-95 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)', boxShadow: '0 8px 20px rgba(236, 72, 153, 0.35)' }}
              >
                Gioca di nuovo
              </button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <RulesModal endRule={endRule} mode={mode} timerSec={timerSec} onClose={() => setShowRules(false)} />
      )}

      {pendingCategory && !winner && (
        <DifficultyPicker
          category={pendingCategory}
          player={players[currentPlayerIdx]}
          allowedDifficulties={mode.allowedDifficulties}
          onPick={handleDifficultyPick}
          onCancel={() => setPendingCategory(null)}
        />
      )}

      {activeQuestion && !winner && (
        <QuestionModal
          category={activeQuestion.category}
          question={activeQuestion.question}
          player={players[currentPlayerIdx]}
          onResolve={handleResolve}
          canEarnWedge={!players[currentPlayerIdx].wedges.includes(activeQuestion.category.id)}
          alreadyOwned={alreadyOwned}
          timerSec={timerSec}
        />
      )}

      {showEditor && (
        <QuestionEditor
          categories={allCategories}
          onSave={saveCategories}
          storage={storage}
          onClose={() => setShowEditor(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

const TopBarBtn = ({ children, onClick, bg, color, hover, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur text-sm font-semibold shadow-sm transition-colors"
    style={{ background: bg, color }}
    onMouseEnter={(e) => (e.currentTarget.style.background = hover)}
    onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
  >
    {children}
  </button>
);

const TopThemeButton = ({ isDark, toggleTheme, onEditor }) => (
  <div className="fixed top-5 right-5 z-40 flex gap-2">
    <button
      onClick={onEditor}
      className="h-11 px-4 rounded-full flex items-center gap-2 shadow-md backdrop-blur transition-colors text-sm font-semibold"
      style={{
        background: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        color: isDark ? '#e2e8f0' : '#1e293b',
        fontFamily: 'Fredoka, Poppins, sans-serif',
      }}
      title="Modifica spicchi e domande"
    >
      <PenLine size={18} /> Spicchi e domande
    </button>
    <button
      onClick={toggleTheme}
      className="w-11 h-11 rounded-full flex items-center justify-center shadow-md backdrop-blur transition-colors"
      style={{
        background: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        color: isDark ? '#fef3c7' : '#1e293b',
      }}
      title="Cambia tema"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  </div>
);

export default TrivialGame;
