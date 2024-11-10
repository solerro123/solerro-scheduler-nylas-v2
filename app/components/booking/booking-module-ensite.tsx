/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, parseISO } from 'date-fns';
interface TimeSlot {
  slotname: string;
  totalSurveys: number;
  isdisabled: boolean;
  bookingSlots: object,
  setBookingSlots: object,
  value: string;
  displayname: string;
  handleConfirmBooking: object;
}

export function BookingModuleEnsite({ bookingSlots, setBookingSlots, addressTimeZone, lat, lon, handleConfirmBooking }: { addressTimeZone: string, lat: string, lon: string }) {
  const ENSITE_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDA4NiwiaWF0IjoxNzMxMDk3MTkxLCJleHAiOjE3MzM2ODkxOTF9.Fx0lzpKhgSqcdJOYpDjkAUy0vof8wdEKvX34zNkFENw';
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // Track by slotname

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setPopoverOpen(false);
    setSelectedSlot(null); // Reset selected slot when a new date is chosen

    if (date) {
      setIsLoading(true);
      setTimeSlots([])
      console.log("lat LogIn ", lat, lon)
      const apiURL = `https://mysites.ensiteservices.com/api/ensite/getslotforsurvey?creatorparentid=1234&date=${date.toISOString().slice(0, 10)}&latitude=${lat}&longitude=${lon}&issurveycreating=true&clientid=7125`;

      try {
        const response = await fetch(apiURL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ENSITE_ACCESS_TOKEN}`
          },
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data: TimeSlot[] = await response.json();
        console.log(data)
        setTimeSlots(data);
        setIsLoading(false);
        
        setTimer(1);
      } catch (error) {
        console.error("Fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    // setTimeSlots([])
    let interval: ReturnType<typeof setInterval>;
    if (timer !== null && timer > 0) {
      interval = setInterval(() => setTimer((prev) => (prev !== null ? prev - 1 : null)), 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSlotSelect = (slotname: string, slotvalue: string) => {
    console.log(selectedDate, slotname)
    setSelectedSlot(slotname);

    let formattedDate = new Date(selectedDate)
    formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(selectedDate);
    
    console.log(formattedDate);
    
    const data = bookingSlots
    data.date = formattedDate
    data.time = `${slotname} ${slotvalue}`
  };

  const confirmBooking = () => {
    if (selectedDate && selectedSlot) {
      console.log(`Booking confirmed for ${selectedDate.toLocaleDateString()} - ${selectedSlot}`);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center space-x-2">
        <CalendarIcon className="h-4 w-4" />
        <Button variant="outline" className="w-[180px] text-left">
          {addressTimeZone || "Timezone"}
        </Button>
      </div>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={() => setPopoverOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? selectedDate.toDateString() : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {isLoading && <p>Loading...</p>}

      {timer !== null && timer > 0 && (
        <div className="text-center mt-2">
          {/* <p>Time remaining: {timer} seconds</p> */}
          <p>Loading....</p>
        </div>
      )}

      {timeSlots.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">Available Time Slots:</h3>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <Button
                key={slot.slotname}
                disabled={slot.isdisabled}
                onClick={() => handleSlotSelect(slot.slotname, slot.value)}
                className={`w-full ${selectedSlot === slot.slotname ? 'bg-primary/90 text-primary border border-primary' : ''}`} // Apply styles for the selected slot

              >
                {slot.displayname}
              </Button>
            ))}
          </div>
        </div>
      )}

      {selectedSlot && (
        <Button className="w-full" onClick={handleConfirmBooking}>
          Confirm Booking
        </Button>
      )}
    </div>
  );
}
