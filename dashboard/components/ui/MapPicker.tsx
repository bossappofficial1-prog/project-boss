'use client'

import { apiClient } from '@/lib/apis/base'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { LatLng, Icon } from 'leaflet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search, Navigation, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapPickerProps {
  latitude?: number
  longitude?: number
  onLocationChange: (lat: number, lng: number) => void
  className?: string
  placeholder?: string
}

interface LocationSearchResult {
  display_name: string
  lat: string
  lon: string
}

// Component for handling map clicks and marker dragging
function LocationMarker({ position, onPositionChange }: {
  position: LatLng | null
  onPositionChange: (lat: number, lng: number) => void
}) {
  const [markerPosition, setMarkerPosition] = useState<LatLng | null>(position)

  useEffect(() => {
    setMarkerPosition(position)
  }, [position])

  const map = useMapEvents({
    click(e) {
      const newPos = e.latlng
      setMarkerPosition(newPos)
      onPositionChange(newPos.lat, newPos.lng)
    },
  })

  // Custom marker icon
  const customIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  return markerPosition === null ? null : (
    <Marker
      position={markerPosition}
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const newPos = marker.getLatLng()
          setMarkerPosition(newPos)
          onPositionChange(newPos.lat, newPos.lng)
        },
      }}
    >
      <Popup>
        <div className="text-center">
          <div className="font-semibold">Lokasi Terpilih</div>
          <div className="text-sm text-gray-600">
            Lat: {markerPosition.lat.toFixed(6)}<br />
            Lng: {markerPosition.lng.toFixed(6)}
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

// Helper to recenter the map when `position` changes
function RecenterMap({ position }: { position: LatLng | null }) {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    try {
      // animate to new position while keeping current zoom
      map.flyTo(position, map.getZoom(), { duration: 0.8 })
    } catch (e) {
      // ignore if map not ready
    }
  }, [position, map])

  return null
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
  placeholder = 'Cari lokasi...'
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(
    latitude && longitude ? new LatLng(latitude, longitude) : null
  )

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update currentPosition when props change
  useEffect(() => {
    if (latitude && longitude) {
      setCurrentPosition(new LatLng(latitude, longitude))
    }
  }, [latitude, longitude])

  // Default position (Jakarta, Indonesia)
  const defaultPosition = new LatLng(-6.2088, 106.8456)

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newPos = new LatLng(latitude, longitude)
        setCurrentPosition(newPos)
        onLocationChange(latitude, longitude)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Search for locations using Nominatim (OpenStreetMap)
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=5&countrycodes=id`)
      if (!res.ok) {
        console.error('Geocode proxy returned', res.status)
        setSearchResults([])
      } else {
        const data = await res.json()
        setSearchResults(data)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching locations:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value)
    }, 500)
  }

  // Select a location from search results
  const selectLocation = (result: LocationSearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    const newPos = new LatLng(lat, lng)

    setCurrentPosition(newPos)
    onLocationChange(lat, lng)
    setSearchQuery(result.display_name)
    setShowSearchResults(false)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Label htmlFor="location-search" className="text-sm font-medium">
          Cari Lokasi
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="location-search"
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectLocation(result)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                        {result.display_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {isSearching && (
          <div className="absolute z-50 w-full mt-1">
            <Card>
              <CardContent className="p-4 text-center text-sm text-gray-500">
                Mencari lokasi...
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Current Location Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Gunakan Lokasi Saat Ini
        </Button>
      </div>

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Pilih Lokasi di Peta
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Klik pada peta atau drag marker untuk memilih lokasi
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-lg overflow-hidden border">
            <MapContainer
              center={currentPosition || defaultPosition}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterMap position={currentPosition} />
              <LocationMarker
                position={currentPosition}
                onPositionChange={onLocationChange}
              />
            </MapContainer>
          </div>

          {/* Coordinates Display */}
          {currentPosition && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Koordinat Terpilih:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Latitude:</span>
                  <div className="font-mono font-medium">{currentPosition.lat.toFixed(6)}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Longitude:</span>
                  <div className="font-mono font-medium">{currentPosition.lng.toFixed(6)}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}