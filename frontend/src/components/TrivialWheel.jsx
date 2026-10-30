import React, { useState, useEffect, useRef } from 'react';
import { getCategoryIcon } from '../data/icons';

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const describeSector = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
};

// Divide un nome lungo in due righe, spezzando sullo spazio più vicino a metà
const splitLabel = (name) => {
  const mid = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return best < 0 ? [name] : [name.slice(0, best), name.slice(best + 1)];
};

// Righe e dimensione del testo in modo che l'etichetta stia nella larghezza dello spicchio
const fitLabel = (name, available) => {
  const sizeFor = (lines) =>
    Math.max(9, Math.min(17, available / (Math.max(...lines.map((l) => l.length)) * 0.58)));
  let lines = [name];
  let fontSize = sizeFor(lines);
  if (fontSize < 14 && name.includes(' ')) {
    const split = splitLabel(name);
    const splitSize = sizeFor(split);
    if (splitSize > fontSize) {
      lines = split;
      fontSize = splitSize;
    }
  }
  return { lines, fontSize };
};

const TrivialWheel = ({ categories, rotation, isSpinning, onSliceClick, spinDuration = 4000 }) => {
  const [hovered, setHovered] = useState(null);
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const r = 240;
  const anglePerSlice = 360 / categories.length;
  const labelWidth = ((2 * Math.PI * r * 0.62) / categories.length) * 0.85;

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer arrow at top */}
      <div
        className="absolute z-10"
        style={{
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
        }}
      >
        <svg width="44" height="52" viewBox="0 0 44 52">
          <path
            d="M22 50 L4 10 Q22 0 40 10 Z"
            fill="#1e293b"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="12" r="4" fill="#ffffff" />
        </svg>
      </div>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}
      >
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </radialGradient>
          {categories.map((c) => (
            <radialGradient key={c.id} id={`grad-${c.id}`} cx="50%" cy="50%" r="80%">
              <stop offset="40%" stopColor={c.color} />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.85" />
            </radialGradient>
          ))}
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 10} fill="#1e293b" />

        {/* Rotating group */}
        <g
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.21, 1)`
              : 'none',
          }}
        >
          {categories.map((cat, i) => {
            const startAngle = i * anglePerSlice;
            const endAngle = startAngle + anglePerSlice;
            const midAngle = startAngle + anglePerSlice / 2;
            const path = describeSector(cx, cy, r, startAngle, endAngle);
            const labelPos = polarToCartesian(cx, cy, r * 0.62, midAngle);
            const iconPos = polarToCartesian(cx, cy, r * 0.38, midAngle);
            const Icon = getCategoryIcon(cat.icon);
            const label = fitLabel(cat.name, labelWidth);
            const isHovered = hovered === cat.id && !isSpinning;

            return (
              <g
                key={cat.id}
                onMouseEnter={() => setHovered(cat.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => !isSpinning && onSliceClick && onSliceClick(cat)}
                style={{
                  cursor: isSpinning ? 'default' : 'pointer',
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 300ms ease',
                }}
              >
                <path
                  d={path}
                  fill={`url(#grad-${cat.id})`}
                  stroke="#ffffff"
                  strokeWidth="4"
                />
                <g transform={`translate(${iconPos.x - 18}, ${iconPos.y - 18})`}>
                  <circle cx="18" cy="18" r="22" fill="rgba(255,255,255,0.25)" />
                  <Icon x="0" y="0" width="36" height="36" color="#ffffff" strokeWidth={2.2} />
                </g>
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#ffffff"
                  fontSize={label.fontSize}
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'Fredoka, Poppins, sans-serif',
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.35)',
                    pointerEvents: 'none',
                  }}
                  transform={`rotate(${midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle}, ${labelPos.x}, ${labelPos.y})`}
                >
                  {label.lines.map((line, li) => (
                    <tspan
                      key={li}
                      x={labelPos.x}
                      dy={li === 0 ? -((label.lines.length - 1) * label.fontSize * 0.55) : label.fontSize * 1.1}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {categories.map((_, i) => {
            const a = i * anglePerSlice;
            const p = polarToCartesian(cx, cy, r, a);
            return (
              <line
                key={`spoke-${i}`}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke="#ffffff"
                strokeWidth="4"
              />
            );
          })}
        </g>

        {/* Center hub (stays still) */}
        <circle cx={cx} cy={cy} r="58" fill="url(#centerGrad)" stroke="#1e293b" strokeWidth="4" />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="800"
          fill="#1e293b"
          style={{ fontFamily: 'Fredoka, Poppins, sans-serif' }}
        >
          TRIVIAL
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="600"
          fill="#64748b"
          style={{ fontFamily: 'Fredoka, Poppins, sans-serif', letterSpacing: '2px' }}
        >
          ITALIANO
        </text>
      </svg>
    </div>
  );
};

export default TrivialWheel;
