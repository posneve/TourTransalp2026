export interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
  /** Cumulative distance from start in km */
  dist: number;
  /** Cumulative elevation gain from start in metres (based on smoothed elevation) */
  elevGainAcc: number;
  /** Slope grade in % computed over a ±100 m window of smoothed elevation */
  grade: number;
}

export interface TrackStats {
  points: TrackPoint[];
  totalDistanceKm: number;
  elevGainM: number;
  elevLossM: number;
  maxEleM: number;
  minEleM: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Smooth an elevation array with a centred moving average.
 * Window size ~20 removes GPS noise (~0.5 m steps) while preserving real climbs.
 */
function smoothElevation(eles: number[], window = 20): number[] {
  const half = Math.floor(window / 2);
  return eles.map((_, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(eles.length - 1, i + half);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += eles[j];
    return sum / (hi - lo + 1);
  });
}

export async function parseGpx(url: string): Promise<TrackStats> {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');

  const trkpts = Array.from(doc.querySelectorAll('trkpt'));
  const rawPoints = trkpts.map((pt) => ({
    lat: parseFloat(pt.getAttribute('lat') ?? '0'),
    lon: parseFloat(pt.getAttribute('lon') ?? '0'),
    ele: parseFloat(pt.querySelector('ele')?.textContent ?? '0'),
  }));

  // Smooth elevation to remove GPS noise before summing gain/loss
  const smoothedEles = smoothElevation(rawPoints.map((p) => p.ele));

  let totalDistanceKm = 0;
  let elevGainM = 0;
  let elevLossM = 0;
  let maxEleM = -Infinity;
  let minEleM = Infinity;

  const points: TrackPoint[] = rawPoints.map((p, i) => {
    if (i > 0) {
      const prev = rawPoints[i - 1];
      totalDistanceKm += haversineKm(prev.lat, prev.lon, p.lat, p.lon);
      const dEle = smoothedEles[i] - smoothedEles[i - 1];
      if (dEle > 0) elevGainM += dEle;
      else elevLossM += Math.abs(dEle);
    }
    if (p.ele > maxEleM) maxEleM = p.ele;
    if (p.ele < minEleM) minEleM = p.ele;
    return { ...p, dist: totalDistanceKm, elevGainAcc: elevGainM, grade: 0 };
  });

  // Second pass: compute grade at each point using smoothed elevation over a ±100 m window.
  // Binary-search helpers operating on the already-built points array.
  const WINDOW_KM = 0.1; // 100 m each side → ~200 m total window
  const findIdx = (targetDist: number): number => {
    let lo = 0, hi = points.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (points[mid].dist < targetDist) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  for (let i = 0; i < points.length; i++) {
    const d = points[i].dist;
    const backIdx = findIdx(Math.max(0, d - WINDOW_KM));
    const fwdIdx  = findIdx(Math.min(points[points.length - 1].dist, d + WINDOW_KM));
    const horizM  = (points[fwdIdx].dist - points[backIdx].dist) * 1000;
    const elevDiff = smoothedEles[fwdIdx] - smoothedEles[backIdx];
    points[i].grade = horizM > 1 ? (elevDiff / horizM) * 100 : 0;
  }

  return { points, totalDistanceKm, elevGainM, elevLossM, maxEleM, minEleM };
}

