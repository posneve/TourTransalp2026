import { Polyline, MapContainer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import type { TrackPoint } from '../../utils/gpxParser';
import { elevationToColor } from '../../utils/elevationColor';
import MapLayers from '../MapLayers/MapLayers';

interface Props {
  points: TrackPoint[];
  minEle: number;
  maxEle: number;
  hoveredPoint?: TrackPoint | null;
  totalElevGain?: number;
}

function FitBounds({ points }: { points: TrackPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [points, map]);
  return null;
}

export default function StageMap({ points, minEle, maxEle, hoveredPoint, totalElevGain }: Props) {
  const range = maxEle - minEle || 1;

  // Build segments: each segment connects two consecutive points and is coloured
  // by the average elevation of those two points.
  const segments = points.slice(0, -1).map((p, i) => {
    const next = points[i + 1];
    const t = ((p.ele + next.ele) / 2 - minEle) / range;
    return { latlngs: [[p.lat, p.lon], [next.lat, next.lon]] as [number, number][], color: elevationToColor(t) };
  });

  return (
    <MapContainer
      center={[46.5, 11.5]}
      zoom={10}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom
    >
      <MapLayers />
      {segments.map((seg, i) => (
        <Polyline key={i} positions={seg.latlngs} pathOptions={{ color: seg.color, weight: 4, opacity: 0.9 }} />
      ))}
      {hoveredPoint && (
        <CircleMarker
          center={[hoveredPoint.lat, hoveredPoint.lon]}
          radius={8}
          pathOptions={{ color: '#fff', fillColor: '#3498db', fillOpacity: 1, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -12]} opacity={1}>
            <div style={{ lineHeight: '1.5', fontSize: '12px', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#555', marginBottom: 2 }}>📍 {hoveredPoint.dist.toFixed(1)} km</div>
              <div><strong style={{ color: '#1a6faf' }}>{Math.round(hoveredPoint.ele)} m</strong> elevation</div>
              <div><strong style={{ color: '#27ae60' }}>↑ {Math.round(hoveredPoint.elevGainAcc).toLocaleString()} m</strong> gained</div>
              {totalElevGain != null && totalElevGain > 0 && (
                <div style={{ color: '#777' }}>
                  {((hoveredPoint.elevGainAcc / totalElevGain) * 100).toFixed(1)}% of total climb
                </div>
              )}
            </div>
          </Tooltip>
        </CircleMarker>
      )}
      <FitBounds points={points} />
    </MapContainer>
  );
}
