export interface StageInfo {
  id: number;
  name: string;
  start: string;
  end: string;
  gpxFile: string;
  color: string; // used on overview map
}

export const STAGES: StageInfo[] = [
  { id: 1, name: 'Stage 1', start: 'Lienz',       end: 'Sillian',      gpxFile: '/gpx/stage1.gpx', color: '#e74c3c' },
  { id: 2, name: 'Stage 2', start: 'Sillian',     end: 'Falcade',      gpxFile: '/gpx/stage2.gpx', color: '#e67e22' },
  { id: 3, name: 'Stage 3', start: 'Falcade',     end: 'San Martino',  gpxFile: '/gpx/stage3.gpx', color: '#f1c40f' },
  { id: 4, name: 'Stage 4', start: 'San Martino', end: 'Possagno',     gpxFile: '/gpx/stage4.gpx', color: '#2ecc71' },
  { id: 5, name: 'Stage 5', start: 'Possagno',    end: 'Semonzo',      gpxFile: '/gpx/stage5.gpx', color: '#1abc9c' },
  { id: 6, name: 'Stage 6', start: 'Semonzo',     end: 'Lavarone',     gpxFile: '/gpx/stage6.gpx', color: '#3498db' },
  { id: 7, name: 'Stage 7', start: 'Lavarone',    end: 'Riva del Garda', gpxFile: '/gpx/stage7.gpx', color: '#9b59b6' },
];
