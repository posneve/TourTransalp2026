import type { TrackStats } from '../../utils/gpxParser';
import type { StageInfo } from '../../data/stages';
import styles from './StageStats.module.css';

interface Props {
  stage: StageInfo;
  stats: TrackStats;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export default function StageStats({ stage, stats }: Props) {
  return (
    <div className={styles.wrapper}>
      <Stat label="Distance"       value={`${stats.totalDistanceKm.toFixed(1)} km`} />
      <Stat label="Elevation Gain" value={`↑ ${Math.round(stats.elevGainM).toLocaleString()} m`} />
      <Stat label="Elevation Loss" value={`↓ ${Math.round(stats.elevLossM).toLocaleString()} m`} />
      <Stat label="Max Elevation"  value={`${Math.round(stats.maxEleM).toLocaleString()} m`} />
      <Stat label="Start"          value={stage.start} />
      <Stat label="Finish"         value={stage.end} />
    </div>
  );
}
