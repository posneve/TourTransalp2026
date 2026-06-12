import { useCallback, useEffect, useMemo, useState } from 'react';import { useParams, Link } from 'react-router-dom';
import StageMap from '../components/StageMap/StageMap';
import ElevationProfile from '../components/ElevationProfile/ElevationProfile';
import StageStats from '../components/StageStats/StageStats';
import StagePlayer from '../components/StagePlayer/StagePlayer';
import { STAGES } from '../data/stages';
import { parseGpx } from '../utils/gpxParser';
import type { TrackPoint, TrackStats } from '../utils/gpxParser';
import styles from './StagePage.module.css';

/** Binary-search for the track point nearest to a given cumulative distance. */
function findNearestPoint(points: TrackPoint[], dist: number): TrackPoint | null {
  if (points.length === 0) return null;
  let lo = 0, hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].dist < dist) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].dist - dist) < Math.abs(points[lo].dist - dist)) lo--;
  return points[lo];
}

export default function StagePage() {
  const { id } = useParams<{ id: string }>();
  const stageId = parseInt(id ?? '1', 10);
  const stage = STAGES.find((s) => s.id === stageId);

  const [stats, setStats] = useState<TrackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // hoverDist: set by mouse over the chart — takes priority over player
  const [hoverDist, setHoverDist] = useState<number | null>(null);
  // playerDist: set by the player animation
  const [playerDist, setPlayerDist] = useState<number | null>(null);
  // mobile collapse state for elevation profile
  const [profileCollapsed, setProfileCollapsed] = useState(false);

  // Active dist used for map marker and chart reference line
  const activeDist = hoverDist ?? playerDist;

  useEffect(() => {
    if (!stage) return;
    setLoading(true);
    setStats(null);
    setError(false);
    setHoverDist(null);
    setPlayerDist(null);
    parseGpx(stage.gpxFile)
      .then((s) => { setStats(s); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [stage]);

  const hoveredPoint = useMemo(
    () => (stats && activeDist !== null ? findNearestPoint(stats.points, activeDist) : null),
    [stats, activeDist]
  );

  const handleHoverDist = useCallback((dist: number | null) => setHoverDist(dist), []);
  const handlePlayerProgress = useCallback((dist: number | null) => setPlayerDist(dist), []);

  if (!stage) {
    return <div className={styles.error}>Stage not found. <Link to="/">Back to overview</Link></div>;
  }

  const prevStage = STAGES.find((s) => s.id === stageId - 1);
  const nextStage = STAGES.find((s) => s.id === stageId + 1);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.stageTitle}>
          <span className={styles.stageLabel}>{stage.name}</span>
          <h1 className={styles.stageName}>{stage.start} → {stage.end}</h1>
        </div>
        <div className={styles.navButtons}>
          {prevStage && <Link to={`/stage/${prevStage.id}`} className={styles.navBtn}>← S{prevStage.id}</Link>}
          {nextStage && <Link to={`/stage/${nextStage.id}`} className={styles.navBtn}>S{nextStage.id} →</Link>}
        </div>
      </div>

      {loading && <div className={styles.loading}>Loading stage data…</div>}
      {error  && <div className={styles.error}>Failed to load GPX data.</div>}

      {stats && (
        <div className={styles.content}>
          <div className={styles.mapArea}>
            <StageMap
              points={stats.points}
              minEle={stats.minEleM}
              maxEle={stats.maxEleM}
              hoveredPoint={hoveredPoint}
              totalElevGain={stats.elevGainM}
            />
          </div>
          <div className={styles.bottomPanel}>
            <div className={styles.profileArea}>
              <div className={styles.profileHeader}>
                <h3 className={styles.panelTitle}>Elevation Profile</h3>
                <button
                  className={styles.collapseBtn}
                  onClick={() => setProfileCollapsed((c) => !c)}
                  aria-expanded={!profileCollapsed}
                >
                  {profileCollapsed ? '▼ Show' : '▲ Hide'}
                </button>
              </div>
              <div className={`${styles.collapsibleContent}${profileCollapsed ? ` ${styles.collapsed}` : ''}`}>
                <div className={styles.chartWrapper}>
                  <ElevationProfile
                    points={stats.points}
                    totalElevGain={stats.elevGainM}
                    activeDist={activeDist}
                    onHoverDist={handleHoverDist}
                  />
                </div>
                <StagePlayer
                  totalDistanceKm={stats.totalDistanceKm}
                  activeDist={activeDist}
                  onProgress={handlePlayerProgress}
                />
              </div>
            </div>
            <div className={styles.statsArea}>
              <h3 className={styles.panelTitle}>Stage Statistics</h3>
              <StageStats stage={stage} stats={stats} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
