import { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { TrackPoint } from '../../utils/gpxParser';

interface Props {
  points: TrackPoint[];
  totalElevGain: number;
  activeDist?: number | null;
  onHoverDist?: (dist: number | null) => void;
}

interface ChartPoint {
  dist: number;
  ele: number;
  elevGainAcc: number;
}

// Downsample to keep the chart performant (max 500 points)
function downsample(points: TrackPoint[], max: number): TrackPoint[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  return points.filter((_, i) => i % step === 0);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { payload: ChartPoint }[];
  totalElevGain: number;
  onHoverDist?: (dist: number | null) => void;
}

function CustomTooltip({ active, payload, totalElevGain, onHoverDist }: CustomTooltipProps) {
  // Drive the map indicator from Recharts' own tooltip active state —
  // more reliable than onMouseMove on the outer chart.
  const activeDist = active && payload?.length ? payload[0].payload.dist : null;
  useEffect(() => {
    onHoverDist?.(activeDist);
  }, [activeDist]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = totalElevGain > 0 ? ((d.elevGainAcc / totalElevGain) * 100).toFixed(1) : '0.0';
  return (
    <div style={{
      background: '#1e1e2e', border: '1px solid #444', borderRadius: '8px',
      padding: '10px 14px', color: '#eee', fontSize: '12px', lineHeight: '1.6',
      pointerEvents: 'none',
    }}>
      <div style={{ marginBottom: 4, color: '#aaa' }}>📍 {d.dist} km</div>
      <div><span style={{ color: '#3498db', fontWeight: 600 }}>{d.ele} m</span> elevation</div>
      <div><span style={{ color: '#2ecc71', fontWeight: 600 }}>↑ {Math.round(d.elevGainAcc).toLocaleString()} m</span> gained</div>
      <div style={{ color: '#aaa' }}>{pct}% of total climb</div>
    </div>
  );
}

export default function ElevationProfile({ points, totalElevGain, activeDist, onHoverDist }: Props) {
  const data: ChartPoint[] = downsample(points, 500).map((p) => ({
    dist: Math.round(p.dist * 10) / 10,
    ele: Math.round(p.ele),
    elevGainAcc: p.elevGainAcc,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
      >
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3498db" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3498db" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="dist"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(v: number) => `${v} km`}
          tick={{ fill: '#ccc', fontSize: 11 }}
          axisLine={{ stroke: '#555' }}
          tickLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => `${v} m`}
          tick={{ fill: '#ccc', fontSize: 11 }}
          axisLine={{ stroke: '#555' }}
          tickLine={false}
          width={55}
        />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as readonly { payload: ChartPoint }[] | undefined}
              totalElevGain={totalElevGain}
              onHoverDist={onHoverDist}
            />
          )}
        />
        {activeDist != null && (
          <ReferenceLine
            x={Math.round(activeDist * 10) / 10}
            stroke="rgba(255,255,255,0.6)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}
        <Area
          type="monotone"
          dataKey="ele"
          stroke="#3498db"
          strokeWidth={2}
          fill="url(#elevGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#fff', stroke: '#3498db', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}


