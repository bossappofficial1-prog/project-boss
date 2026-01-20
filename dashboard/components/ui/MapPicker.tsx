'use client'

import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, useMap } from '@/components/ui/map'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Search, Navigation, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type ComponentProps } from 'react'

interface MapPickerProps {
  latitude?: number
  longitude?: number
  onLocationChange: (lat: number, lng: number) => void
  className?: string
  placeholder?: string
  showControls?: boolean
  controlsProps?: ComponentProps<typeof MapControls>
  mapProps?: Omit<ComponentProps<typeof Map>, 'center' | 'zoom'>
  showSelectionMarker?: boolean
  renderMarkerContent?: (position: { lat: number; lng: number }) => ReactNode
  renderMarkerPopup?: (position: { lat: number; lng: number }) => ReactNode
  children?: ReactNode
}

interface LocationSearchResult {
  display_name: string
  lat: string
  lon: string
}

type Position = { lat: number; lng: number }

function RecenterMap({ position }: { position: Position | null }) {
  const { map, isLoaded } = useMap()
  const lastPositionRef = useRef<Position | null>(null)

  useEffect(() => {
    if (!map || !isLoaded || !position) return
    if (lastPositionRef.current
      && lastPositionRef.current.lat === position.lat
      && lastPositionRef.current.lng === position.lng) {
      return
    }
    lastPositionRef.current = position
    map.flyTo({ center: [position.lng, position.lat], zoom: map.getZoom() || 13, duration: 800 })
  }, [map, isLoaded, position])

  return null
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return
    const handler = (e: { lngLat: { lng: number; lat: number } }) => {
      onPick(e.lngLat.lat, e.lngLat.lng)
    }

    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [map, isLoaded, onPick])

  return null
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
  placeholder = 'Cari lokasi...',
  showControls = true,
  controlsProps,
  mapProps,
  showSelectionMarker = true,
  renderMarkerContent,
  renderMarkerPopup,
  children
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<Position | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null
  )

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // Update currentPosition when props change
  useEffect(() => {
    if (latitude == null || longitude == null) return
    setCurrentPosition((prev) => {
      if (prev && prev.lat === latitude && prev.lng === longitude) return prev
      return { lat: latitude, lng: longitude }
    })
  }, [latitude, longitude])

  // Default position (Jakarta, Indonesia)
  const defaultPosition = useMemo<Position>(() => ({ lat: -6.2088, lng: 106.8456 }), [])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser ini')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentPosition((prev) => {
          if (prev && prev.lat === latitude && prev.lng === longitude) return prev
          return { lat: latitude, lng: longitude }
        })
        onLocationChange(latitude, longitude)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onLocationChange])

  // Search for locations using Nominatim (OpenStreetMap)
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort()
      }
      const controller = new AbortController()
      searchAbortRef.current = controller
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}&limit=5&countrycodes=id`, {
        signal: controller.signal
      })
      if (!res.ok) {
        console.error('Geocode proxy returned', res.status)
        setSearchResults([])
        setShowSearchResults(false)
      } else {
        const data = await res.json()
        setSearchResults(data)
        setShowSearchResults(true)
      }
    } catch (error) {
      if ((error as any)?.name !== 'AbortError') {
        console.error('Error searching locations:', error)
      }
      setSearchResults([])
      setShowSearchResults(false)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value)
    }, 500)
  }, [searchLocations])

  // Select a location from search results
  const selectLocation = useCallback((result: LocationSearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setCurrentPosition((prev) => {
      if (prev && prev.lat === lat && prev.lng === lng) return prev
      return { lat, lng }
    })
    onLocationChange(lat, lng)
    setSearchQuery(result.display_name)
    setShowSearchResults(false)
  }, [onLocationChange])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }, [])

  const handlePick = useCallback((lat: number, lng: number) => {
    setCurrentPosition((prev) => {
      if (prev && prev.lat === lat && prev.lng === lng) return prev
      return { lat, lng }
    })
    onLocationChange(lat, lng)
  }, [onLocationChange])

  const mapCenter = useMemo<[number, number]>(() => (
    currentPosition
      ? [currentPosition.lng, currentPosition.lat]
      : [defaultPosition.lng, defaultPosition.lat]
  ), [currentPosition, defaultPosition])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort()
      }
    }
  }, [])

  const markerContent = useMemo(() => {
    if (!currentPosition) return null
    return renderMarkerContent
      ? renderMarkerContent(currentPosition)
      : <div className="h-4 w-4 rounded-full bg-red-500 ring-2 ring-white shadow" />
  }, [currentPosition, renderMarkerContent])

  const markerPopupContent = useMemo(() => {
    if (!currentPosition) return null
    return renderMarkerPopup
      ? renderMarkerPopup(currentPosition)
      : (
        <div className="text-center">
          <div className="font-semibold">Lokasi Terpilih</div>
          <div className="text-sm text-gray-600">
            Lat: {currentPosition.lat.toFixed(6)}<br />
            Lng: {currentPosition.lng.toFixed(6)}
          </div>
        </div>
      )
  }, [currentPosition, renderMarkerPopup])

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
              {searchResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}-${result.display_name}`}
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
            <div className="h-full w-full">
              <Map
                center={mapCenter}
                zoom={13}
                {...mapProps}
              >
                <RecenterMap position={currentPosition} />
                <MapClickHandler onPick={handlePick} />
                {showControls && (
                  <MapControls
                    position="top-right"
                    showZoom
                    showCompass={false}
                    showLocate={false}
                    {...controlsProps}
                  />
                )}
                {children}
                {showSelectionMarker && currentPosition && (
                  <MapMarker
                    longitude={currentPosition.lng}
                    latitude={currentPosition.lat}
                    draggable
                    onDragEnd={({ lng, lat }) => handlePick(lat, lng)}
                  >
                    <MarkerContent>{markerContent}</MarkerContent>
                    <MarkerPopup>{markerPopupContent}</MarkerPopup>
                  </MapMarker>
                )}
              </Map>
            </div>
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