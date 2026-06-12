import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet';
import { useConsent } from '../../context/ConsentContext';

const MAP_PREF_KEY = 'preferred_map';

const LAYERS = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    name: 'Satellite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
    maxZoom: 19,
  },
  {
    name: 'Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
];

/** Listens for layer changes and persists the choice when consent is given. */
function LayerPersist({ consented }: { consented: boolean }) {
  useMapEvents({
    baselayerchange(e) {
      if (consented) {
        try { localStorage.setItem(MAP_PREF_KEY, e.name); } catch { /* ignore */ }
      }
    },
  });
  return null;
}

/**
 * Shared base-layer switcher for all maps.
 * Uses only free tile providers — no API key required.
 * Remembers selection in localStorage when the user has given consent.
 */
export default function MapLayers() {
  const { consent } = useConsent();
  const consented = consent === 'accepted';

  // Read saved preference (only meaningful if consent was previously given)
  let saved: string | null = null;
  try { saved = localStorage.getItem(MAP_PREF_KEY); } catch { /* ignore */ }
  const activeLayer = saved ?? LAYERS[0].name;

  return (
    <LayersControl position="topright">
      {LAYERS.map((layer) => (
        <LayersControl.BaseLayer
          key={layer.name}
          name={layer.name}
          checked={layer.name === activeLayer}
        >
          <TileLayer
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={layer.maxZoom}
          />
        </LayersControl.BaseLayer>
      ))}
      <LayerPersist consented={consented} />
    </LayersControl>
  );
}
