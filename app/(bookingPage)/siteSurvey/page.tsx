"use client"

import { useState, useRef, useCallback } from 'react'
import { LoadScript, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MapPin } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const libraries = ["places"]

export default function SiteSurvey() {
    const [address, setAddress] = useState('')
    const [addressVerified, setAddressVerified] = useState(false)
    const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
    const [state, setState] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const mapRef = useRef<google.maps.Map | null>(null)
    const router = useRouter()

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map
        map.setMapTypeId("satellite")
    }, [])

    const handlePlaceSelect = () => {
        const place = autocompleteRef.current?.getPlace()
        if (place && place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const addressComponents = place.address_components || [];
            
            addressComponents.forEach(component => {
                if (component.types.includes('administrative_area_level_1')) {
                    setState(component.short_name);
                }
            });

            setAddress(place.formatted_address || '')
            setMapCenter({ lat, lng })
            mapRef.current?.panTo({ lat, lng })
            setAddressVerified(true)
        }
    }

    const handleProceedToBooking = () => {
        if (state) {
            setIsLoading(true)
            router.push(`/serviceArea/${state.toUpperCase()}`)
        }
    }

    return (
        <LoadScript
            googleMapsApiKey="AIzaSyDKm5SrUJNPaQOU0lpa6swSWkiuKTpzEN0"
            libraries={libraries as any}
        >
            <Card className="w-full max-w-4xl mx-auto p-1">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Sol%20Logo-ALAxHZ7LTdpSeW1ipOPaZfUCVDGoAC.png"
                            alt="Solerro Logo"
                            width={100}
                            height={100}
                        />
                    </div>
                    <CardTitle>Book a Site Survey</CardTitle>
                    <CardDescription>Enter your address to begin scheduling a survey</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2 w-full">
                                <Label htmlFor="address">Address</Label>
                                <div className="relative w-full">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <Autocomplete
                                        onLoad={(autocomplete) => {
                                            autocompleteRef.current = autocomplete
                                        }}
                                        onPlaceChanged={handlePlaceSelect}
                                        className="w-full"
                                    >
                                        <Input
                                            id="address"
                                            placeholder="Enter survey address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            className="w-full pl-10"
                                        />
                                    </Autocomplete>
                                </div>
                            </div>
                            {addressVerified && (
                                <Button
                                    className="w-full mt-4"
                                    onClick={handleProceedToBooking}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : 'Proceed to Booking'}
                                </Button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <Label>Location</Label>
                            <div className="h-[400px] w-full">
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={mapCenter}
                                    zoom={19}
                                    mapTypeId="satellite"
                                    onLoad={onMapLoad}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: false,
                                        mapTypeControl: false,
                                        scaleControl: false,
                                        streetViewControl: false,
                                        rotateControl: false,
                                        fullscreenControl: false
                                    }}
                                >
                                    <Marker position={mapCenter} />
                                </GoogleMap>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </LoadScript>
    )
}