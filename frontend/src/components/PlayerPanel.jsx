import React from 'react';
import { Trophy, Crown, Flag } from 'lucide-react';

// Small pie (one wedge per category) that fills in as the player wins categories
const MiniPie = ({ wedges, categories, playerColor, size = 56 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const anglePerSlice = 360 / categories.length;

  const polar = (angleDeg, radius) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const sector = (startAngle, endAngle) => {
    const start = polar(endAngle, r);
    const end = polar(startAngle, r);
    const large = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 2} fill={playerColor} />
      {categories.map((cat, i) => {
        const start = i * anglePerSlice;
        const end = start + anglePerSlice;
        const filled = wedges.includes(cat.id);
        return (
          <path
            key={cat.id}
            d={sector(start, end)}
            fill={filled ? cat.color : '#ffffff'}
            stroke={playerColor}
            strokeWidth="1.5"
            style={{ transition: 'fill 400ms ease' }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r="5" fill={playerColor} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
};

const PlayerPanel = ({ players, currentPlayerIdx, categories, winner, closerId }) => {
  // Con molti giocatori le schede si rimpiccioliscono per stare accanto alla ruota
  const compact = players.length > 6;
  return (
    <div className={`w-full max-w-sm ${compact ? 'space-y-1.5' : 'space-y-3'}`}>
      <div
        className="text-xs font-bold tracking-widest uppercase text-slate-500 px-1"
        style={{ fontFamily: 'Fredoka, sans-serif' }}
      >
        Giocatori
      </div>
      {players.map((p, idx) => {
        const isActive = idx === currentPlayerIdx && !winner;
        const isWinner = winner?.id === p.id;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-2xl transition-all ${compact ? 'px-3 py-1.5' : 'p-3'}`}
            style={{
              background: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
              border: `2px solid ${isActive ? p.color : 'transparent'}`,
              boxShadow: isActive ? `0 10px 25px ${p.color}30` : '0 2px 8px rgba(0,0,0,0.04)',
              transform: isActive ? 'translateX(4px)' : 'translateX(0)',
              fontFamily: 'Fredoka, sans-serif',
            }}
          >
            <MiniPie wedges={p.wedges} categories={categories} playerColor={p.color} size={compact ? 40 : 56} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-slate-800 truncate">{p.name}</div>
                {isWinner && <Crown size={16} color="#f59e0b" fill="#f59e0b" />}
                {p.id === closerId && <Flag size={14} color={p.color} />}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Trophy size={13} color={p.color} />
                <span className="text-xs font-semibold text-slate-500">
                  {categories.filter((c) => p.wedges.includes(c.id)).length} / {categories.length} cunei
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-black text-slate-800 leading-none ${compact ? 'text-lg' : 'text-2xl'}`}>{p.points || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">punti</div>
            </div>
            {isActive && (
              <div
                className="text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded-full"
                style={{ background: p.color }}
              >
                Turno
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlayerPanel;
