// Day/night boundary, adapted from the Leaflet.Terminator approach.
const D2R = Math.PI / 180
const R2D = 180 / Math.PI

/** Polygon (lat, lng pairs) covering the part of the Earth where it is night. */
export function nightPolygon(at: Date, step = 1): [number, number][] {
  const julian = at.getTime() / 86400000 + 2440587.5
  const n = julian - 2451545.0
  const gmst = (((18.697374558 + 24.06570982441908 * n) % 24) + 24) % 24

  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * D2R
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R
  const epsilon = (23.4393 - 0.0000004 * n) * D2R
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) * R2D
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) * R2D

  const points: [number, number][] = []
  for (let lng = -180; lng <= 180; lng += step) {
    const ha = (gmst * 15 + lng - alpha) * D2R
    const lat = Math.atan(-Math.cos(ha) / Math.tan(delta * D2R)) * R2D
    points.push([lat, lng])
  }
  const pole = delta < 0 ? 90 : -90
  return [[pole, -180], ...points, [pole, 180]]
}
