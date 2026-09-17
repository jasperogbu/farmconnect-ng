import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { LocateFixed } from 'lucide-react'
import { NIGERIA_CENTER, NIGERIA_ZOOM } from '@/lib/constants'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#15803d;color:white;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.35)">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

function ClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({ value, onChange, height = 280 }) {
  const [locating, setLocating] = useState(false)

  const center = useMemo(() => {
    if (value?.latitude != null && value?.longitude != null) {
      return [value.latitude, value.longitude]
    }
    return NIGERIA_CENTER
  }, [value?.latitude, value?.longitude])

  function pick(latitude, longitude) {
    onChange({ latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) })
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pick(position.coords.latitude, position.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const hasValue = value?.latitude != null && value?.longitude != null

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border" style={{ height }}>
        <MapContainer center={center} zoom={hasValue ? 11 : NIGERIA_ZOOM} scrollWheelZoom style={{ height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={pick} />
          {hasValue && <Marker position={[value.latitude, value.longitude]} icon={pinIcon} />}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {hasValue
            ? `Pinned at ${value.latitude}, ${value.longitude}`
            : 'Tap the map to pin your farm or delivery location.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          <LocateFixed className="h-3.5 w-3.5" />
          {locating ? 'Locating…' : 'Use my location'}
        </Button>
      </div>
    </div>
  )
}
