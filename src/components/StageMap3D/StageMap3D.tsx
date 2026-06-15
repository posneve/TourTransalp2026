import { useEffect, useRef, useState } from 'react';
import { Map as MaplibreMap, LngLatBounds, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { TrackPoint } from '../../utils/gpxParser';
import { elevationToColor } from '../../utils/elevationColor';
import styles from './StageMap3D.module.css';

interface Props {
  points: TrackPoint[];
  minEle: number;
  maxEle: number;
  hoveredPoint?: TrackPoint | null;
  totalElevGain?: number;
}

type BaseLayer = 'map' | 'satellite';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** Minimal MapLibre style that shows Esri satellite imagery (free, no API key). */
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics',
    },
  },
  layers: [
    { id: 'bg',        type: 'background' as const, paint: { 'background-color': '#000000' } },
    { id: 'satellite', type: 'raster'     as const, source: 'esri-satellite' },
  ],
};

/** Compute compass bearing (0–360°) from one lon/lat to another. */
function computeBearing(fromLon: number, fromLat: number, toLon: number, toLat: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const dLon = toRad(toLon - fromLon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export default function StageMap3D({ points, minEle, maxEle, hoveredPoint }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const prevPointRef = useRef<TrackPoint | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('satellite');

  // Build / rebuild map whenever route or base layer changes
  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const range = maxEle - minEle || 1;

    // Each segment is a separate GeoJSON Feature so it can carry its own colour
    const routeFeatures = points.slice(0, -1).map((p, i) => {
      const next = points[i + 1];
      const t = ((p.ele + next.ele) / 2 - minEle) / range;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [[p.lon, p.lat], [next.lon, next.lat]] as [number, number][],
        },
        properties: { color: elevationToColor(t) },
      };
    });

    const midPt = points[Math.floor(points.length / 2)];
    const map = new MaplibreMap({
      container: containerRef.current,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: baseLayer === 'satellite' ? (SATELLITE_STYLE as any) : MAP_STYLE,
      center: [midPt.lon, midPt.lat],
      zoom: 11,
      pitch: 45,
      bearing: 0,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Free terrain DEM — no API key required
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 14,
        encoding: 'terrarium',
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });

      // Route coloured by elevation
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: routeFeatures },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': baseLayer === 'satellite' ? 5 : 4,
          'line-opacity': 0.95,
        },
      });

      // Animated rider marker
      map.addSource('rider', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'rider-dot',
        type: 'circle',
        source: 'rider',
        paint: {
          'circle-radius': 9,
          'circle-color': '#3498db',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
        },
      });

      // Fit camera to the full route with a slight tilt
      const allCoords = points.map((p) => [p.lon, p.lat] as [number, number]);
      const bounds = allCoords.reduce(
        (b, c) => b.extend(c),
        new LngLatBounds(allCoords[0], allCoords[0]),
      );
      map.fitBounds(bounds, { padding: 60, pitch: 45, duration: 800 });
    });

    return () => {
      prevPointRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [points, minEle, maxEle, baseLayer]);

  // Update rider position and fly the camera to follow from behind.
  // Zoom is intentionally NOT forced — the user can freely zoom in/out.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const riderSource = map.getSource('rider') as GeoJSONSource | undefined;
    if (!riderSource) return; // sources not yet added (map still loading)

    if (!hoveredPoint) {
      riderSource.setData({ type: 'FeatureCollection', features: [] });
      prevPointRef.current = null;
      return;
    }

    riderSource.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [hoveredPoint.lon, hoveredPoint.lat] },
          properties: {},
        },
      ],
    });

    // Bearing: direction rider is moving so camera looks forward
    const bearing = prevPointRef.current
      ? computeBearing(
          prevPointRef.current.lon,
          prevPointRef.current.lat,
          hoveredPoint.lon,
          hoveredPoint.lat,
        )
      : map.getBearing();

    prevPointRef.current = hoveredPoint;

    // No zoom: user keeps whatever zoom they've set
    map.easeTo({
      center: [hoveredPoint.lon, hoveredPoint.lat],
      pitch: 55,
      bearing,
      duration: 400,
    });
  }, [hoveredPoint]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.layerToggle}>
        <button
          className={`${styles.layerBtn}${baseLayer === 'map' ? ` ${styles.layerBtnActive}` : ''}`}
          onClick={() => setBaseLayer('map')}
        >Map</button>
        <button
          className={`${styles.layerBtn}${baseLayer === 'satellite' ? ` ${styles.layerBtnActive}` : ''}`}
          onClick={() => setBaseLayer('satellite')}
        >Satellite</button>
      </div>
    </div>
  );
}

