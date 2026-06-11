import { MapContainer, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { TrackPoint } from '../../utils/gpxParser';
import type { StageInfo } from '../../data/stages';
import MapLayers from '../MapLayers/MapLayers';

interface StageTrack {
  stage: StageInfo;
  points: TrackPoint[];
}

interface Props {
  tracks: StageTrack[];
}

function FitAll({ tracks }: { tracks: StageTrack[] }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = tracks.flatMap((t) => t.points.map((p) => [p.lat, p.lon] as [number, number]));
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
    }
  }, [tracks, map]);
  return null;
}

function StagePolyline({ stage, points }: StageTrack) {
  const navigate = useNavigate();
  const latlngs = points.map((p) => [p.lat, p.lon] as [number, number]);
  return (
    <Polyline
      positions={latlngs}
      pathOptions={{ color: stage.color, weight: 4, opacity: 0.85 }}
      eventHandlers={{ click: () => navigate(`/stage/${stage.id}`) }}
    >
    </Polyline>
  );
}

export default function OverviewMap({ tracks }: Props) {
  return (
    <MapContainer
      center={[46.5, 11.5]}
      zoom={8}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom
    >
      <MapLayers />
      {tracks.map((t) => (
        <StagePolyline key={t.stage.id} stage={t.stage} points={t.points} />
      ))}
      <FitAll tracks={tracks} />
    </MapContainer>
  );
}
