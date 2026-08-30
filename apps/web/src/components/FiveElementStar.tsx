import { useTranslation } from 'react-i18next';

// Fixed generating-cycle order (相生): each element generates the next one.
// Arranging the 5 vertices in this order around a circle is what makes the
// classic wuxing pentagram possible — generating relationships fall on the
// pentagon's outer edges (i -> i+1), and controlling relationships (相剋)
// fall exactly on the inner star diagonals (i -> i+2). See relationOf() below.
const ORDER = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;
type ElementKey = typeof ORDER[number];

const ELEMENT_ZH: Record<ElementKey, string> = {
  Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水',
};

const ELEMENT_COLOR: Record<ElementKey, string> = {
  Wood: '#22c55e',
  Fire: '#ef4444',
  Earth: '#eab308',
  Metal: '#94a3b8',
  Water: '#3b82f6',
};

const ELEMENT_EMOJI: Record<ElementKey, string> = {
  Wood: '🌱', Fire: '🔥', Earth: '🪨', Metal: '⚔️', Water: '💧',
};

// offset (target index - day-master index, mod 5) -> relation key.
// 0: same as day master · 1: day master generates this · 2: day master
// controls this · 3: this controls day master · 4: this generates day master.
const OFFSET_RELATION = ['same', 'i_generate', 'i_control', 'controls_me', 'generates_me'] as const;

function relationOf(dayMasterIdx: number, elementIdx: number): typeof OFFSET_RELATION[number] {
  const offset = ((elementIdx - dayMasterIdx) % 5 + 5) % 5;
  return OFFSET_RELATION[offset];
}

interface FiveElementStarProps {
  strengths: Record<string, number>;
  dayMasterElement: string; // 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'
}

export default function FiveElementStar({ strengths, dayMasterElement }: FiveElementStarProps) {
  const { i18n, t } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const dayMasterIdx = ORDER.indexOf(dayMasterElement as ElementKey);
  const values = ORDER.map(el => strengths[el] ?? 0);
  const maxValue = Math.max(...values, 0.0001);

  const CX = 150, CY = 150, R = 96, LABEL_R = 132;
  const MIN_RADIUS_FRACTION = 0.16; // zero-strength elements still get a visible dot

  function vertex(i: number, radius: number) {
    const angle = ((-90 + 72 * i) * Math.PI) / 180;
    return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
  }

  const axisPoints = ORDER.map((_, i) => vertex(i, R));
  const labelPoints = ORDER.map((_, i) => vertex(i, LABEL_R));
  const dataPoints = ORDER.map((_, i) => {
    const frac = Math.max(values[i] / maxValue, MIN_RADIUS_FRACTION);
    return vertex(i, R * frac);
  });

  const pentagonPath = axisPoints.map(p => `${p.x},${p.y}`).join(' ');
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const starLines = ORDER.map((_, i) => {
    const from = axisPoints[i];
    const to = axisPoints[(i + 2) % 5];
    return { from, to };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 300 300" style={{ width: '100%', maxWidth: 340, height: 'auto' }}>
        {/* Reference rings */}
        {[0.33, 0.66, 1].map(f => (
          <polygon
            key={f}
            points={ORDER.map((_, i) => { const p = vertex(i, R * f); return `${p.x},${p.y}`; }).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
          />
        ))}

        {/* Pentagram (相剋 controlling relationships) */}
        {starLines.map((line, i) => (
          <line
            key={i}
            x1={line.from.x} y1={line.from.y}
            x2={line.to.x} y2={line.to.y}
            stroke="rgba(201,168,76,0.18)"
            strokeWidth={1}
          />
        ))}

        {/* Pentagon (相生 generating relationships) */}
        <polygon points={pentagonPath} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} />

        {/* Data polygon — actual element strengths */}
        <polygon
          points={dataPath}
          fill="rgba(201,168,76,0.22)"
          stroke="#C9A84C"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === dayMasterIdx ? 6 : 4} fill={ELEMENT_COLOR[ORDER[i]]} stroke="#0E0620" strokeWidth={1.5} />
        ))}

        {/* Vertex labels */}
        {labelPoints.map((p, i) => {
          const el = ORDER[i];
          const relation = relationOf(dayMasterIdx, i);
          const isSelf = i === dayMasterIdx;
          return (
            <g key={i} transform={`translate(${p.x}, ${p.y})`}>
              <text
                textAnchor="middle"
                dy={-6}
                style={{ fontSize: 15, fontWeight: isSelf ? 800 : 600 }}
                fill={isSelf ? '#C9A84C' : '#F0EDE8'}
              >
                {ELEMENT_EMOJI[el]} {isZh ? ELEMENT_ZH[el] : el}
              </text>
              <text
                textAnchor="middle"
                dy={11}
                style={{ fontSize: 10.5 }}
                fill="rgba(255,255,255,0.5)"
              >
                {isSelf ? (isZh ? '日主' : 'Day Master') : t(`chart.bazi.wuxing_relations.${relation}`)}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', textAlign: 'center', margin: '6px 0 0', maxWidth: 300, lineHeight: 1.5 }}>
        {t('chart.bazi.wuxing_star_caption')}
      </p>
    </div>
  );
}
