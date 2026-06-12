import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './StagePlayer.module.css';

interface Props {
  totalDistanceKm: number;
  activeDist: number | null;
  onProgress: (dist: number | null) => void;
}

const SPEEDS = [0.5, 1, 2, 5];
const FPS = 20;

export default function StagePlayer({ totalDistanceKm, activeDist, onProgress }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const distRef = useRef(0);
  const isDragging = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Keep distRef in sync when external activeDist changes (e.g. mouse hover overrides player)
  // Only sync when NOT playing and not dragging so the player doesn't fight with hover
  useEffect(() => {
    if (!isPlaying && !isDragging.current && activeDist !== null) distRef.current = activeDist;
  }, [activeDist, isPlaying]);

  const stop = useCallback(() => setIsPlaying(false), []);

  const play = () => {
    // If at the end, restart from beginning
    if (distRef.current >= totalDistanceKm) {
      distRef.current = 0;
      onProgress(0);
    }
    setIsPlaying(true);
  };

  const reset = () => {
    setIsPlaying(false);
    distRef.current = 0;
    onProgress(null);
  };

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const kmPerFrame = (totalDistanceKm / 30 / FPS) * speed;
    const id = setInterval(() => {
      distRef.current = Math.min(distRef.current + kmPerFrame, totalDistanceKm);
      onProgress(distRef.current);
      if (distRef.current >= totalDistanceKm) {
        stop();
      }
    }, 1000 / FPS);
    return () => clearInterval(id);
  }, [isPlaying, speed, totalDistanceKm, onProgress, stop]);

  const pct = totalDistanceKm > 0 ? Math.min(100, ((activeDist ?? 0) / totalDistanceKm) * 100) : 0;

  /** Seek to a clientX position relative to the track element. */
  const seekToClientX = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newDist = fraction * totalDistanceKm;
    distRef.current = newDist;
    onProgress(newDist);
  }, [totalDistanceKm, onProgress]);

  // Document-level mouse events so dragging outside the track still works
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (isDragging.current) seekToClientX(e.clientX); };
    const onUp   = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [seekToClientX]);

  return (
    <div className={styles.player}>
      <div className={styles.controls}>
        <button className={styles.btn} onClick={reset} title="Reset" aria-label="Reset">⏮</button>
        <button
          className={`${styles.btn} ${styles.playBtn}`}
          onClick={isPlaying ? stop : play}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className={styles.speeds}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className={styles.distLabel}>
          {activeDist !== null ? `${activeDist.toFixed(1)} km` : `${totalDistanceKm.toFixed(1)} km`}
        </span>
      </div>
      <div
        ref={trackRef}
        className={styles.progressTrack}
        onClick={(e) => seekToClientX(e.clientX)}
        onMouseDown={(e) => { isDragging.current = true; seekToClientX(e.clientX); }}
        onTouchStart={(e) => seekToClientX(e.touches[0].clientX)}
        onTouchMove={(e) => seekToClientX(e.touches[0].clientX)}
        role="slider"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        <div className={styles.progressThumb} style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}
