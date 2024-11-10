// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";

import { BookingModule } from '../../../components/booking/booking-module';
import { BookingModuleEnsite } from '../../../components/booking/booking-module-ensite';
import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react'
import { LoadScript, Autocomplete, GoogleMap, Marker } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MapPin } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { haversineDistance, getTimeZone } from '@/app/actions';
import { createMeetingActionSiteSurvey, createMeetingActionEnSiteSurvey } from "@/app/actions";

const libraries = ["places"]

// Lazy load the form component
const BookingForm = lazy(() => import('@/app/components/forms/booking-form')) // Replace with actual path

const GOOGLE_MAPS_API = 'AIzaSyDKm5SrUJNPaQOU0lpa6swSWkiuKTpzEN0'

const confirmBooking = async (formData, isEnsite) => {
    try {
        
        if (!isEnsite) {
            const result = await createMeetingActionSiteSurvey(formData);
            return result; // return result if you want to handle it elsewhere
        } else {
            const result = await createMeetingActionEnSiteSurvey(formData);
            return result; // return result if you want to handle it elsewhere
        }
    } catch (error) {
        console.error("Error confirming booking:", error);
    }
};


async function appendToFormData(formData: FormData, dataObject: object) {
    for (const key in dataObject) {
        if (dataObject.hasOwnProperty(key)) {
            formData.append(key, dataObject[key]);
        }
    }
}

const formData = new FormData()

function SiteSurvey() {
     // const router = useRouter()
     const searchParams = useSearchParams();
    const [showButton, setShowButton] = useState(true)
    const [siteDistance, setSiteDistance] = useState(0);
    const [isEnsite, setIsEnsite] = useState(true)
    const [address, setAddress] = useState(searchParams.get("address") || "")
    const [isAddressDisabled, setIsAddressDisabled] = useState(false)
    const [bookingFormFilled, setBookingFormFilled] = useState(false)
    const [addressVerified, setAddressVerified] = useState(false)
    const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
    const [state, setState] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showForm, setShowForm] = useState(false) // State to control form visibility
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const mapRef = useRef<google.maps.Map | null>(null)
    const [addressTimeZone, setAddressTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const [latLon, setLatLon] = useState({ lat: '', lon: '' })
    // Convert all search params to an object in one line
    const paramsObject = Object.fromEntries(searchParams.entries());
    const [bookingFormData, setBookingFormData] = useState({
        firstName: paramsObject.firstName,
        lastName: paramsObject.lastName,
        email: paramsObject.email,
        salesRepName: paramsObject.salesRepName,
        level: paramsObject.level,
        atticAccess: paramsObject.atticAccess,
        typeOfMount: paramsObject.typeOfMount,
        metersOnSite: paramsObject.metersOnSite,
        electricalPanelsOnSite: paramsObject.electricalPanelsOnSite,
        animals: paramsObject.animals,
        noteToInstallerFromSalesRep: paramsObject.noteToInstallerFromSalesRep,
        phoneNumber: paramsObject.phoneNumber,
    })
    const [bookingSlots, setBookingSlots] = useState({ timezone: addressTimeZone, date: "", time: "", dateTime: "" })
    const [eventInfo, setEventInfo] = useState({ username: "", eventTypeId: "", meetingLength: "" })

   

    
    // console.log(paramsObject)
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map
        map.setMapTypeId("satellite")
    }, [])

    const handlePlaceSelect = async () => {
        const place = autocompleteRef.current?.getPlace()
        if (place && place.geometry && place.geometry.location) {
            // Target address (9901 United Drive, Houston, TX 77036)
            const targetLat = 29.6764; // Latitude for 9901 United Drive
            const targetLng = -95.5203; // Longitude for 9901 United Drive


            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            setLatLon({ lat: lat.toString(), lon: lng.toString() })
            // Calculate the distance
            const distance = await haversineDistance(lat, lng, targetLat, targetLng);
            console.log(`Distance from 9901 United Drive, Houston, TX 77036: ${distance}`)
            setSiteDistance(distance);
            // console.log(distance)
            if (distance < 60) {
                // console.log("console.log(isEnsite)" , isEnsite)
                setIsEnsite(false)
                // console.log(isEnsite)
            }
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

            const timezone = await getTimeZone(GOOGLE_MAPS_API, lat, lng)

            setAddressTimeZone(timezone)
        }
    }

    const handleProceedToBooking = () => {
        if (state) {
            setShowButton(false)
            setIsLoading(true)
            setIsAddressDisabled(true)
            // Here you can show the form component after clicking the button
            setShowForm(true)
        }
    }

    const handleConfirmBooking = async () => {
        console.log("appending to form data", address, bookingSlots, bookingFormData)
        await appendToFormData(formData, { address: address });
        await appendToFormData(formData, bookingSlots);
        await appendToFormData(formData, bookingFormData);
        await appendToFormData(formData, eventInfo);
        formData.append("isEnsite", isEnsite)
        confirmBooking(formData, isEnsite)
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
    }

    return (

        <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API}
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
                        <div className="space-y-4 flex flex-col"> {/* Lazy load the BookingForm justify-center items-center*/}
                            <div className="space-y-2 w-full">
                                <Label htmlFor="address">Address</Label>

                                <div className="relative w-full">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <Autocomplete
                                        onLoad={(autocomplete) => {
                                            autocompleteRef.current = autocomplete;
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
                                            disabled={isAddressDisabled}
                                            defaultValue={address}
                                        />
                                    </Autocomplete>
                                </div>
                            </div>
                            {addressVerified && (
                                <>
                                    {showButton && (<Button
                                        className="w-full mt-4"
                                        onClick={handleProceedToBooking}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : 'Proceed to Booking'}
                                    </Button>
                                    )}

                                    {/* <div className="mt-4">
                                        <h3>Distance from 9901 United Drive, Houston, TX 77036:</h3>
                                        <p>{siteDistance} Miles</p>
                                    </div> */}
                                </>
                            )}

                            {/* Lazy load the BookingForm */}
                            {showForm && !bookingFormFilled && (
                                <Suspense fallback={<div>Loading form...</div>}>
                                    <BookingForm bookingFormData={bookingFormData} setBookingFormData={setBookingFormData} eventType={{ id: 1, username: "deefault462" }} searchParams={paramsObject} bookingFormFilled={bookingFormFilled} setBookingFormFilled={setBookingFormFilled} />
                                </Suspense>
                            )}

                            {/* Lazy load the BookingForm */}
                            {bookingFormFilled && (
                                <>
                                    <div className="mt-4">
                                        {isEnsite ? (
                                            <>
                                                {/* <div>Loading Ensite Calendar</div> */}
                                                <BookingModuleEnsite handleConfirmBooking={handleConfirmBooking} bookingSlots={bookingSlots} setBookingSlots={setBookingSlots} addressTimeZone={addressTimeZone} lat={latLon.lat} lon={latLon.lon} />
                                            </>
                                        ) : (
                                            <>
                                                {/* <div>Loading SiteSurvey Calendar</div> */}
                                                <BookingModule eventInfo={eventInfo} setEventInfo={setEventInfo} handleConfirmBooking={handleConfirmBooking} bookingSlots={bookingSlots} setBookingSlots={setBookingSlots} addressTimeZone={addressTimeZone} serviceArea={state} />
                                            </>
                                        )}
                                    </div>
                                </>
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
                                        fullscreenControl: false,
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


export default function SiteSurveyWrapper() {
    return (
      <Suspense fallback={<div>Loading Site Survey...</div>}>
        <SiteSurvey />
      </Suspense>
    );
  }
