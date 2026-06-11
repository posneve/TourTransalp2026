/**
 * Maps a normalised value [0, 1] to a hex colour on a
 * blue → cyan → green → yellow → red gradient.
 */
export function elevationToColor(t: number): string {
  // 5-stop gradient: blue, cyan, green, yellow, red
  const stops = [
    { r: 33,  g: 150, b: 243 }, // #2196f3 blue   (t=0)
    { r: 0,   g: 229, b: 255 }, // #00e5ff cyan   (t=0.25)
    { r: 76,  g: 175, b: 80  }, // #4caf50 green  (t=0.5)
    { r: 255, g: 235, b: 59  }, // #ffeb3b yellow (t=0.75)
    { r: 244, g: 67,  b: 54  }, // #f44336 red    (t=1)
  ];

  const scaled = t * (stops.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, stops.length - 1);
  const frac = scaled - lo;

  const lerp = (a: number, b: number) => Math.round(a + (b - a) * frac);
  const c = { r: lerp(stops[lo].r, stops[hi].r), g: lerp(stops[lo].g, stops[hi].g), b: lerp(stops[lo].b, stops[hi].b) };
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
}
