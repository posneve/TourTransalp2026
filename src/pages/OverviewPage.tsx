import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OverviewMap from '../components/OverviewMap/OverviewMap';
import { STAGES } from '../data/stages';
import { parseGpx } from '../utils/gpxParser';
import type { TrackStats } from '../utils/gpxParser';
import styles from './OverviewPage.module.css';

interface StageTrack {
  stage: typeof STAGES[number];
  points: TrackStats['points'];
}

export default function OverviewPage() {
  const [tracks, setTracks] = useState<StageTrack[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, TrackStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      STAGES.map(async (stage) => {
        const stats = await parseGpx(stage.gpxFile);
        return { stage, stats };
      })
    ).then((results) => {
      setTracks(results.map(({ stage, stats }) => ({ stage, points: stats.points })));
      const sm: Record<number, TrackStats> = {};
      results.forEach(({ stage, stats }) => { sm[stage.id] = stats; });
      setStatsMap(sm);
      setLoading(false);
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.mapWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading routes…</div>
        ) : (
          <OverviewMap tracks={tracks} />
        )}
      </div>
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Stages</h2>
        {STAGES.map((stage) => {
          const s = statsMap[stage.id];
          return (
            <Link key={stage.id} to={`/stage/${stage.id}`} className={styles.stageCard}>
              <span className={styles.stageColor} style={{ background: stage.color }} />
              <div className={styles.stageInfo}>
                <span className={styles.stageName}>
                  {stage.name}: {stage.start} → {stage.end}
                </span>
                {s && (
                  <span className={styles.stageMeta}>
                    {s.totalDistanceKm.toFixed(1)} km · ↑{Math.round(s.elevGainM).toLocaleString()} m
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </aside>
    </div>
  );
}
