import type { CSSProperties } from 'react';

const Cloud = ({ style }: { style: CSSProperties }) => (
  <svg
    viewBox="0 0 200 80"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    className="absolute pointer-events-none select-none"
  >
    <ellipse cx="100" cy="55" rx="90" ry="28" fill="rgba(255,255,255,0.08)" />
    <ellipse cx="70" cy="45" rx="50" ry="32" fill="rgba(255,255,255,0.08)" />
    <ellipse cx="130" cy="48" rx="45" ry="28" fill="rgba(255,255,255,0.06)" />
    <ellipse cx="100" cy="42" rx="40" ry="26" fill="rgba(255,255,255,0.07)" />
  </svg>
);

const stars = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 45}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 1,
  delay: `${Math.random() * 4}s`,
  duration: `${Math.random() * 3 + 2}s`,
}));

export default function SkyBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden -z-10"
      style={{
        background: 'linear-gradient(180deg, #0b1a3b 0%, #2e6bb5 55%, #b6d8f7 100%)',
      }}
    >
      {/* Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* Clouds */}
      <Cloud
        style={{
          width: 320,
          top: '18%',
          left: '-8%',
          animation: 'float-cloud 12s ease-in-out infinite',
          animationDelay: '0s',
        }}
      />
      <Cloud
        style={{
          width: 260,
          top: '28%',
          right: '-6%',
          animation: 'float-cloud-slow 16s ease-in-out infinite',
          animationDelay: '-5s',
        }}
      />
      <Cloud
        style={{
          width: 200,
          top: '42%',
          left: '10%',
          animation: 'float-cloud 20s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />
      <Cloud
        style={{
          width: 280,
          top: '55%',
          right: '5%',
          animation: 'float-cloud-slow 14s ease-in-out infinite',
          animationDelay: '-3s',
          opacity: 0.7,
        }}
      />
      <Cloud
        style={{
          width: 350,
          bottom: '5%',
          left: '-5%',
          animation: 'float-cloud 18s ease-in-out infinite',
          animationDelay: '-10s',
          opacity: 0.5,
        }}
      />
    </div>
  );
}
