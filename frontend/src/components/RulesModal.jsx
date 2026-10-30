import React from 'react';
import { BookOpen, Flag, Target, PhoneOff, Dices, Trophy, Scale } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { SCORING } from '../data/questions';

// Riassunto di una riga della regola di fine partita (usato anche nella schermata iniziale)
export const endRuleSummary = (endRule) =>
  endRule.type === 'points'
    ? `Vince chi fa più punti: ogni risposta giusta vale ${SCORING.correct} punti. Quando una squadra arriva a ${endRule.target ?? '…'} punti si gioca l'ultimo giro, poi la partita finisce.`
    : `Vince chi fa più punti: ogni risposta giusta vale ${SCORING.correct} punti e chi conquista per primo tutti gli spicchi ne guadagna ${SCORING.closeBonus}. A quel punto si gioca l'ultimo giro, poi la partita finisce.`;

const Section = ({ icon: Icon, color, title, children, textMuted }) => (
  <div className="flex gap-3">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, color }}>
      <Icon size={18} />
    </div>
    <div className="flex-1">
      <div className="font-bold mb-0.5">{title}</div>
      <div className="text-sm leading-relaxed" style={{ color: textMuted }}>{children}</div>
    </div>
  </div>
);

// Regole della partita: si apre all'inizio di ogni nuova partita e dal pulsante "Regole"
const RulesModal = ({ endRule, mode, timerSec, onClose }) => {
  const { isDark } = useTheme();
  const isPoints = endRule.type === 'points';

  const bg = isDark ? '#111a2e' : '#ffffff';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#475569';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(10px)', animation: 'fadeIn 250ms ease' }}
    >
      <div
        className="w-full max-w-xl rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
        style={{
          background: bg,
          color: textMain,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'popIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: 'Fredoka, Poppins, sans-serif',
        }}
      >
        <div className="px-6 py-5 flex items-center gap-3 text-white" style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase opacity-90">
              {mode.name} · {isPoints ? `obiettivo ${endRule.target} punti` : 'completamento ruota'}
            </div>
            <h2 className="text-2xl font-bold">Regole della partita</h2>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <Section icon={isPoints ? Target : Flag} color="#ec4899" title="Obiettivo" textMuted={textMuted}>
            {isPoints
              ? <>Arrivare per primi a <b>{endRule.target} punti</b>, ma vince chi a fine partita ne ha di più.</>
              : <>Conquistare per primi <b>tutti gli spicchi</b> della ruota, ma vince chi a fine partita ha più punti.</>}
          </Section>

          <Section icon={Dices} color="#8b5cf6" title="Come si gioca" textMuted={textMuted}>
            A turno ogni squadra gira la ruota e risponde a una domanda dello spicchio uscito, scegliendo tra 4 risposte
            {timerSec > 0 ? <> entro <b>{timerSec} secondi</b></> : ' senza limite di tempo'}. Una risposta giusta conquista lo
            spicchio, se non lo si ha già. Le domande non si ripetono durante la partita.
          </Section>

          <Section icon={Trophy} color="#f59e0b" title="Punti" textMuted={textMuted}>
            <b>{SCORING.correct} punti</b> per ogni risposta giusta, anche su uno spicchio già conquistato.
            {' '}<b>{SCORING.closeBonus} punti</b> di bonus a chi conquista per primo tutti gli spicchi
            {isPoints ? ' (in questa modalità non fa finire la partita).' : '.'} Le risposte sbagliate valgono 0.
          </Section>

          <Section icon={Scale} color="#10b981" title="Fine della partita" textMuted={textMuted}>
            {isPoints
              ? <>Quando una squadra raggiunge {endRule.target} punti si gioca l'ultimo giro, così tutte le squadre hanno gli stessi turni.</>
              : <>Quando una squadra conquista tutti gli spicchi si gioca l'ultimo giro, così tutte le squadre hanno gli stessi turni.</>}
            {' '}Vince chi ha più punti; a parità chi ha più spicchi, poi chi {isPoints ? 'ha raggiunto per primo l\'obiettivo' : 'ha completato la ruota'}.
          </Section>

          <div className="rounded-2xl p-4 border-2 flex gap-3" style={{ borderColor: '#ef4444', background: '#ef444412' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-500 text-white">
              <PhoneOff size={18} />
            </div>
            <div>
              <div className="font-bold text-red-500 mb-1">Fair play</div>
              <ul className="text-sm leading-relaxed list-disc pl-4" style={{ color: textMain }}>
                <li><b>Telefoni via dal tavolo</b>: niente ricerche su internet, assistenti vocali o chat.</li>
                <li>Niente suggerimenti alle altre squadre mentre rispondono.</li>
                <li>Chiudere una domanda vale come risposta sbagliata e fa passare il turno.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6 py-4" style={{ borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <button
            autoFocus
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-lg hover:opacity-95 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #ec4899, #f59e0b)', boxShadow: '0 10px 25px rgba(236, 72, 153, 0.35)' }}
          >
            Abbiamo capito, si gioca!
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default RulesModal;
