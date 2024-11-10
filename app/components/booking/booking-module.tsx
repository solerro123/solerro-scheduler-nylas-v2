// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Get all supported time zones
const supportedTimezones = Intl.supportedValuesOf("timeZone");

type BookingModuleProps = {
  serviceArea: string,
  addressTimeZone: string,
  bookingSlots: object, 
  setBookingSlots: object,
  handleConfirmBooking: any,
  eventInfo: object, 
  setEventInfo: object
};


const fetchAvailability = async (serviceArea) => {
  try {
      const response = await fetch(`http://localhost:3000/api/getAvailableTimes?serviceArea=${serviceArea}`);
      const data = await response.json();
      if (response.ok) {
          console.log(data)
          return data;
      } else {
          alert(data.error)
          console.error(data.error);
          return null;
      }
  } catch (error) {
      alert(error)
      console.error("Error fetching data:", error);
      return null;
  }
};


export function BookingModule({ serviceArea, addressTimeZone, bookingSlots, setBookingSlots, handleConfirmBooking, eventInfo, setEventInfo }: BookingModuleProps) {
  const [freeSlots, setFreeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(() => addressTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [searchText, setSearchText] = useState("");


  useEffect(() => {
    // Fetch availability and set state
    fetchAvailability(serviceArea).then(data => {

        
        if(data.filteredSlots){
            setFreeSlots(data.filteredSlots);
            const tempEventInfo = eventInfo
            tempEventInfo.username = data.username
            tempEventInfo.eventTypeId = data.eventTypeId
            tempEventInfo.meetingLength = data.meetingLength
            setEventInfo(tempEventInfo)
        }

        
    });
}, []);

  useEffect(() => {
    if (freeSlots?.length > 0) {
      const date = utcToZonedTime(parseISO(freeSlots[0]), timezone);
      setSelectedDate(date);
    }
  }, [freeSlots, timezone]);

  const availableDates = Array.from(new Set(freeSlots?.map(slot => 
    format(utcToZonedTime(parseISO(slot), timezone), 'yyyy-MM-dd')
  )));

  const availableTimesForSelectedDate = selectedDate
    ? freeSlots.filter(slot => 
        format(utcToZonedTime(parseISO(slot), timezone), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      )
    : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    setSelectedTime(null);
  };

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      const bookingTime = zonedTimeToUtc(parseISO(selectedTime), timezone);
      const data = bookingSlots
      data.dateTime = selectedTime
      data.date = format(bookingTime, 'MMMM d, yyyy', { timeZone: timezone })
      data.time = format(bookingTime, "HH:mm:ss")

      setBookingSlots(data)
      console.log(bookingSlots)
      // console.log(selectedTime)
      handleConfirmBooking()
      console.log(`Booking confirmed for ${format(bookingTime, 'MMMM d, yyyy HH:mm:ss', { timeZone: timezone })} ${timezone}`);
    }
  };

  if (freeSlots?.length === 0) {
    return <div className="text-center p-4">Fetching Data Please wait:- No available slots at the moment.</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        {/* Searchable Timezone Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] text-left">
              {timezone || <span>Select timezone</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-2">
            <input
              type="text"
              placeholder="Search timezone..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
            <div className="max-h-48 overflow-y-auto">
              {supportedTimezones
                .filter((tz) =>
                  tz.toLowerCase().includes(searchText.toLowerCase())
                )
                .map((tz) => (
                  <div
                    key={tz}
                    onClick={() => {
                      handleTimezoneChange(tz);
                      setSearchText("");
                    }}
                    className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-200 ${
                      tz === timezone ? "font-semibold text-blue-600" : ""
                    }`}
                  >
                    {tz}
                  </div>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={(date) => 
              !availableDates.includes(format(date, 'yyyy-MM-dd')) ||
              date < new Date()
            }
          />
        </PopoverContent>
      </Popover>

      {selectedDate && (
        <div className="grid grid-cols-3 gap-2">
          {availableTimesForSelectedDate.map((slot) => {
            const localTime = utcToZonedTime(parseISO(slot), timezone);
            return (
              <Button
                key={slot}
                variant={selectedTime === slot ? "default" : "outline"}
                onClick={() => handleTimeSelect(slot)}
              >
                {format(localTime, 'h:mm a')}
              </Button>
            );
          })}
        </div>
      )}

      {selectedDate && selectedTime && (
        <Button className="w-full" onClick={handleBooking}>
          Confirm Booking
        </Button>
      )}
    </div>
  );
}
