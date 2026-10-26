import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { cityById } from '../data'
import { clock, offsetLabel, offsetMinutes } from '../lib/time'
import { nightPolygon } from '../lib/terminator'

export type Pin = {
  id: string
  short: string
  emoji: string
  color: string
  cityId: string
  travelling: boolean
}

type Props = {
  now: Date
  pins: Pin[]
  me: { emoji: string; color: string; cityId: string }
  selected: string | null
  onSelect: (id: string | null) => void
  mapStyle: 'satellite' | 'dark'
  night: boolean
  hour24: boolean
  /** Pixels covered by the bottom sheet, so focused pins land in the visible area. */
  bottomInset: number
}

const TILES = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery © Esri',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap © CARTO',
  },
}

// Simplified nautical time zones: 15° bands centred on multiples of 15°.
const BAND_OFFSETS = Array.from({ length: 25 }, (_, i) => i - 12)

export function MapView({ now, pins, me, selected, onSelect, mapStyle, night, hour24, bottomInset }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const tiles = useRef<L.TileLayer | null>(null)
  const nightLayer = useRef<L.Polygon | null>(null)
  const bandHighlight = useRef<L.Rectangle | null>(null)
  const markers = useRef<L.LayerGroup | null>(null)
  const [bandX, setBandX] = useState<{ off: number; x: number }[]>([])
  const minute = Math.floor(now.getTime() / 60000)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Init once.
  useEffect(() => {
    if (!el.current || map.current) return
    const m = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 1,
      maxZoom: 8,
      zoomSnap: 0.25,
      worldCopyJump: false,
      maxBounds: [
        [-85, -230],
        [85, 230],
      ],
      maxBoundsViscosity: 0.8,
    }).setView([30, 15], 1.75)
    m.attributionControl.setPrefix(false)

    const lines = L.layerGroup().addTo(m)
    for (let i = 0; i <= 24; i++) {
      const lng = -180 + 7.5 + i * 15 - (i === 24 ? 7.5 : 0)
      L.polyline(
        [
          [-85, lng],
          [85, lng],
        ],
        { color: '#fff', weight: 1, opacity: 0.22, dashArray: '3 5', interactive: false },
      ).addTo(lines)
    }

    markers.current = L.layerGroup().addTo(m)
    m.on('click', () => onSelectRef.current(null))

    const measure = () =>
      setBandX(BAND_OFFSETS.map((off) => ({ off, x: m.latLngToContainerPoint([0, Math.max(-176, Math.min(176, off * 15))]).x })))
    m.on('move zoom resize', measure)
    measure()

    const ro = new ResizeObserver(() => m.invalidateSize())
    ro.observe(el.current)
    map.current = m
    return () => {
      ro.disconnect()
      m.remove()
      map.current = null
    }
  }, [])

  // Base tiles.
  useEffect(() => {
    const m = map.current
    if (!m) return
    tiles.current?.remove()
    const t = TILES[mapStyle]
    tiles.current = L.tileLayer(t.url, { attribution: t.attribution, noWrap: true, subdomains: 'abcd', detectRetina: true }).addTo(m)
    tiles.current.bringToBack()
    el.current?.classList.toggle('map-satellite', mapStyle === 'satellite')
  }, [mapStyle])

  // Night overlay, refreshed every minute.
  useEffect(() => {
    const m = map.current
    if (!m) return
    nightLayer.current?.remove()
    nightLayer.current = null
    if (!night) return
    nightLayer.current = L.polygon(nightPolygon(new Date(minute * 60000)), {
      stroke: false,
      fillColor: '#000814',
      fillOpacity: 0.45,
      interactive: false,
    }).addTo(m)
  }, [night, minute])

  const myCity = cityById(me.cityId)
  const myOff = offsetMinutes(myCity.tz, now)
  const selectedPin = pins.find((p) => p.id === selected)
  const focusOff = selectedPin ? offsetMinutes(cityById(selectedPin.cityId).tz, now) : myOff

  // Highlight the time-zone band of whoever is focused (you by default).
  useEffect(() => {
    const m = map.current
    if (!m) return
    bandHighlight.current?.remove()
    const centre = Math.round(focusOff / 60) * 15
    bandHighlight.current = L.rectangle(
      [
        [-85, centre - 7.5],
        [85, centre + 7.5],
      ],
      { stroke: false, fillColor: '#f5d90a', fillOpacity: 0.09, interactive: false },
    ).addTo(m)
  }, [focusOff])

  // Markers.
  useEffect(() => {
    const group = markers.current
    if (!group) return
    group.clearLayers()
    const at = new Date(minute * 60000)

    const meIcon = L.divIcon({
      className: 'pin-host',
      iconSize: [0, 0],
      html: `<div class="me-pin"><span class="me-pulse"></span><span class="me-dot"></span><span class="me-label">You · ${clock(myCity.tz, at, hour24)}</span></div>`,
    })
    L.marker([myCity.lat, myCity.lng], { icon: meIcon, zIndexOffset: -100, interactive: false }).addTo(group)

    // Spread people who are in the same city.
    const perCity = new Map<string, number>([[me.cityId, 1]])
    for (const p of pins) {
      const city = cityById(p.cityId)
      const idx = perCity.get(p.cityId) ?? 0
      perCity.set(p.cityId, idx + 1)
      const off = offsetMinutes(city.tz, at)
      const icon = L.divIcon({
        className: 'pin-host',
        iconSize: [0, 0],
        html: `<div class="pin ${p.id === selected ? 'pin-sel' : ''}" style="--c:${p.color};--dx:${idx * 56}px">
          <div class="pin-bubble"><b>${clock(city.tz, at, hour24)}</b><span>${offsetLabel(off)}</span></div>
          <div class="pin-avatar">${p.emoji}${p.travelling ? '<i>✈️</i>' : ''}</div>
          <div class="pin-name">${p.short}</div>
        </div>`,
      })
      L.marker([city.lat, city.lng], { icon, zIndexOffset: p.id === selected ? 1000 : 0 })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelectRef.current(p.id)
        })
        .addTo(group)
    }
  }, [pins, selected, minute, myCity, me.cityId, hour24])

  // Fly to the selected friend, keeping them above the sheet.
  useEffect(() => {
    const m = map.current
    if (!m || !selectedPin) return
    const city = cityById(selectedPin.cityId)
    const zoom = Math.max(m.getZoom(), 3)
    const pt = m.project([city.lat, city.lng], zoom).add([0, bottomInset / 2])
    m.flyTo(m.unproject(pt, zoom), zoom, { duration: 0.9 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, selectedPin?.cityId])

  return (
    <div className="map-wrap">
      <div ref={el} className="map" />
      <div className="tz-strip">
        {bandX.map(({ off, x }) => (
          <span key={off} className={off * 60 === Math.round(focusOff / 60) * 60 ? 'on' : ''} style={{ left: x }}>
            {off > 0 ? `+${off}` : off === 0 ? '0' : `−${-off}`}
          </span>
        ))}
      </div>
    </div>
  )
}
