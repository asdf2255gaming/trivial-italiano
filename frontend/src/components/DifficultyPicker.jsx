import React from 'react';
import { X, Sprout, Zap, Flame } from 'lucide-react';
import { DIFFICULTY_META } from '../data/questions';
import { useTheme } from '../contexts/ThemeContext';
import { getCategoryIcon } from '../data/icons';

const diffIconMap = { Sprout, Zap, Flame };

const DifficultyPicker = ({ category, player, allowedDifficulties, onPick, onCancel }) => {
  const { isDark } = useTheme();
  const Icon = getCategoryIcon(category.icon);

  const bg = isDark ? '#111a2e' : '#ffffff';
  const bgSoft = isDark ? '#1e293b' : '#f8fafc';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        animation: 'fadeIn 250ms ease',
        fontFamily: 'Fredoka, Poppins, sans-serif',
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: bg,
          color: textMain,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'popIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              <Icon size={24} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-white text-xs font-semibold tracking-widest uppercase opacity-90">
                Categoria
              </div>
              <h2 className="text-white text-xl font-bold">{category.name}</h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Annulla"
          >
            <X size={20} />
          </button>
        </div>

        {player && (
          <div
            className="px-6 py-2.5 flex items-center gap-2"
            style={{ background: `${player.color}15`, borderBottom: `1px solid ${border}` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: player.color }} />
            <span className="text-sm font-semibold" style={{ color: textMain }}>
              Turno di <span style={{ color: player.color }}>{player.name}</span>
            </span>
          </div>
        )}

        <div className="px-6 py-6">
          <h3 className="text-lg font-bold text-center mb-1" style={{ color: textMain }}>
            Scegli la difficoltà
          </h3>
          <p className="text-sm text-center mb-5" style={{ color: textMuted }}>
            Più alta la difficoltà, più grande la sfida
          </p>

          <div className="space-y-3">
            {allowedDifficulties.map((diff) => {
              const meta = DIFFICULTY_META[diff];
              const DiffIcon = diffIconMap[meta.icon];
              return (
                <button
                  key={diff}
                  onClick={() => onPick(diff)}
                  className="w-full group flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 font-bold transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: bgSoft,
                    borderColor: border,
                    color: textMain,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = meta.color;
                    e.currentTarget.style.background = `${meta.color}15`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = border;
                    e.currentTarget.style.background = bgSoft;
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: meta.color, color: '#fff' }}
                  >
                    {DiffIcon && <DiffIcon size={22} />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-base" style={{ color: textMain }}>{meta.label}</div>
                    <div className="text-xs font-medium" style={{ color: textMuted }}>
                      {diff === 'easy' && 'Domande di cultura generale di base'}
                      {diff === 'medium' && 'Richiede un po\' di conoscenza'}
                      {diff === 'hard' && 'Per veri esperti!'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.85) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default DifficultyPicker;
