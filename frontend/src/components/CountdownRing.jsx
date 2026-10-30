import React, { useEffect, useState, useRef } from 'react';
import { playTick } from '../utils/sound';

// Circular countdown ring with tension effects.
// Props: duration (seconds), onExpire, paused, color
const CountdownRing = ({ duration = 20, onExpire, paused = false, color = '#ec4899' }) => {
  const [remaining, setRemaining] = useState(duration);
  const expiredRef = useRef(false);
  const lastTickSecRef = useRef(duration);

  useEffect(() => {
    expiredRef.current = false;
    setRemaining(duration);
    lastTickSecRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (paused || expiredRef.current) return;
    const start = performance.now();
    const initial = remaining;

    let frameId;
    const loop = () => {
      const elapsed = (performance.now() - start) / 1000;
      const left = Math.max(0, initial - elapsed);
      setRemaining(left);

      const secInt = Math.ceil(left);
      if (secInt !== lastTickSecRef.current && secInt > 0 && secInt <= 5) {
        playTick(0.09);
        lastTickSecRef.current = secInt;
      }

      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire && onExpire();
        return;
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const size = 72;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, remaining / duration);
  const offset = c * (1 - progress);

  const danger = remaining <= 5;
  const ringColor = danger ? '#ef4444' : color;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        animation: danger ? 'tensePulse 0.6s ease-in-out infinite' : 'none',
      }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 300ms ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-black"
        style={{
          color: ringColor,
          fontFamily: 'Fredoka, Poppins, sans-serif',
          fontSize: '20px',
        }}
      >
        {Math.ceil(remaining)}
      </div>
      <style>{`
        @keyframes tensePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

export default CountdownRing;
