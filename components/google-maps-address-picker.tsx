// @ts-nocheck
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Locate, Loader2 } from 'lucide-react'

interface AddressComponents {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  landmark: string
  lat?: number
  lng?: number
  formattedAddress?: string
}

interface GoogleMapsAddressPickerProps {
  onAddressSelect: (address: AddressComponents) => void
  defaultCenter?: { lat: number; lng: number }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Load Google Maps script once
let googleMapsLoaded = false
let googleMapsLoadPromise: Promise<void> | null = null

function loadGoogleMapsScript(): Promise<void> {
  if (googleMapsLoaded && window.google?.maps) return Promise.resolve()
  if (googleMapsLoadPromise) return googleMapsLoadPromise

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      googleMapsLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => { googleMapsLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return googleMapsLoadPromise
}

export function GoogleMapsAddressPicker({ onAddressSelect, defaultCenter }: GoogleMapsAddressPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [address, setAddress] = useState<AddressComponents>({
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', landmark: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [locatingUser, setLocatingUser] = useState(false)

  const center = defaultCenter || { lat: 13.0827, lng: 80.2707 } // Chennai default

  // Parse address components from Google Places result
  const parseAddressComponents = useCallback((place: google.maps.places.PlaceResult | google.maps.GeocoderResult) => {
    const components = place.address_components || []
    const parsed: AddressComponents = {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      landmark: '',
      formattedAddress: 'formatted_address' in place ? place.formatted_address || '' : '',
    }

    let streetNumber = ''
    let route = ''
    let sublocality = ''
    let locality = ''

    for (const comp of components) {
      const types = comp.types
      if (types.includes('street_number')) streetNumber = comp.long_name
      if (types.includes('route')) route = comp.long_name
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) sublocality = comp.long_name
      if (types.includes('locality')) locality = comp.long_name
      if (types.includes('administrative_area_level_3') && !locality) locality = comp.long_name
      if (types.includes('administrative_area_level_1')) parsed.state = comp.long_name
      if (types.includes('postal_code')) parsed.postalCode = comp.long_name
      if (types.includes('country')) parsed.country = comp.long_name
    }

    parsed.addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || sublocality || parsed.formattedAddress?.split(',')[0] || ''
    parsed.addressLine2 = sublocality && route ? sublocality : ''
    parsed.city = locality || ''

    return parsed
  }, [])

  // Reverse geocode from lat/lng
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder()
    try {
      const response = await geocoder.geocode({ location: { lat, lng } })
      if (response.results[0]) {
        const parsed = parseAddressComponents(response.results[0])
        parsed.lat = lat
        parsed.lng = lng
        setAddress(parsed)
        onAddressSelect(parsed)
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
  }, [parseAddressComponents, onAddressSelect])

  // Initialize map
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await loadGoogleMapsScript()
        if (cancelled || !mapRef.current) return

        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary
        const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary

        const map = new Map(mapRef.current, {
          center,
          zoom: 14,
          mapId: 'uyarvom-checkout-map',
          disableDefaultUI: false,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        })

        const marker = new AdvancedMarkerElement({
          map,
          position: center,
          gmpDraggable: true,
          title: 'Delivery location',
        })

        // On marker drag end → reverse geocode
        marker.addListener('dragend', () => {
          const pos = marker.position as google.maps.LatLng | google.maps.LatLngLiteral
          const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat
          const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng
          map.panTo({ lat, lng })
          reverseGeocode(lat, lng)
        })

        // On map click → move marker
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            marker.position = e.latLng
            reverseGeocode(e.latLng.lat(), e.latLng.lng())
          }
        })

        mapInstanceRef.current = map
        markerRef.current = marker

        // Setup Places Autocomplete
        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['address_components', 'formatted_address', 'geometry'],
            types: ['address'],
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry?.location) return

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()

            map.panTo({ lat, lng })
            map.setZoom(17)
            marker.position = { lat, lng }

            const parsed = parseAddressComponents(place)
            parsed.lat = lat
            parsed.lng = lng
            setAddress(parsed)
            setSearchQuery(place.formatted_address || '')
            onAddressSelect(parsed)
          })

          autocompleteRef.current = autocomplete
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Google Maps init error:', err)
        setIsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Get user's current location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser')
      return
    }

    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo({ lat, lng })
          mapInstanceRef.current.setZoom(17)
          markerRef.current.position = { lat, lng }
        }

        reverseGeocode(lat, lng)
        setLocatingUser(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please allow location access.')
        setLocatingUser(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for your address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-24"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 text-xs"
        >
          {locatingUser ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Locate className="h-3 w-3 mr-1" />}
          Use GPS
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border">
        {isLoading && (
          <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">Loading map...</span>
          </div>
        )}
        <div ref={mapRef} className="w-full h-[280px]" />
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Drag pin or click map to set location
        </div>
      </div>

      {/* Auto-filled Address Fields */}
      {address.addressLine1 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selected Location</p>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Address Line 1</Label>
              <Input
                value={address.addressLine1}
                onChange={(e) => { const a = { ...address, addressLine1: e.target.value }; setAddress(a); onAddressSelect(a) }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Address Line 2 / Landmark</Label>
              <Input
                value={address.addressLine2}
                onChange={(e) => { const a = { ...address, addressLine2: e.target.value }; setAddress(a); onAddressSelect(a) }}
                placeholder="Apartment, building, landmark..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={address.city}
                  onChange={(e) => { const a = { ...address, city: e.target.value }; setAddress(a); onAddressSelect(a) }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input
                  value={address.state}
                  onChange={(e) => { const a = { ...address, state: e.target.value }; setAddress(a); onAddressSelect(a) }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Pincode</Label>
                <Input
                  value={address.postalCode}
                  onChange={(e) => { const a = { ...address, postalCode: e.target.value }; setAddress(a); onAddressSelect(a) }}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
