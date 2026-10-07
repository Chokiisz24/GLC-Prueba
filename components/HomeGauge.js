export default function HomeGauge() {
  const ticks = Array.from({ length: 25 }, (_, i) => {
    const a = (-125 + i * (250 / 24)) * Math.PI / 180;
    const x1 = 170 + Math.cos(a) * 146;
    const y1 = 170 + Math.sin(a) * 146;
    const x2 = 170 + Math.cos(a) * (i % 4 === 0 ? 128 : 134);
    const y2 = 170 + Math.sin(a) * (i % 4 === 0 ? 128 : 134);
    return { x1, y1, x2, y2, major: i % 4 === 0 };
  });

  return (
    <div className="rally-gauge" aria-label="Guadalajara Lancer Club desde 2022">
      <svg viewBox="0 0 340 340" role="img" aria-hidden="true">
        <circle cx="170" cy="170" r="150" className="rally-gauge-ring" />
        <circle cx="170" cy="170" r="118" className="rally-gauge-inner" />
        <g>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className={t.major ? 'rally-gauge-tick major' : 'rally-gauge-tick'}
            />
          ))}
        </g>
        <g className="rally-gauge-needle">
          <line x1="170" y1="170" x2="170" y2="65" />
          <circle cx="170" cy="170" r="9" />
          <circle cx="170" cy="170" r="3" className="hub" />
        </g>
      </svg>

      <div className="rally-gauge-copy">
        <strong>2022</strong>
        <span>DESDE</span>
      </div>
    </div>
  );
}
