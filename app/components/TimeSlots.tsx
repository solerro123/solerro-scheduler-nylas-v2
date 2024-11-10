/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import {
  addMinutes,
  format,
  fromUnixTime,
  isAfter,
  isBefore,
  parse,
} from "date-fns";

import {  format as formatInTimeZone } from 'date-fns-tz';

import prisma from "../lib/db";
import { Prisma } from "@prisma/client";
import { nylas } from "../lib/nylas";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NylasResponse, GetFreeBusyResponse } from "nylas";
import { useRouter, useSearchParams } from "next/navigation";
interface iappProps {
  selectedDate: Date;
  userName: string;
  meetingDuration: number;
  selectedTimezone: string;
}

async function getAvailability(selectedDate: Date, userName: string) {
  const currentDay = format(selectedDate, "EEEE");

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);
  const data = await prisma.availability.findFirst({
    where: {
      day: currentDay as Prisma.EnumDayFilter,
      User: {
        username: userName,
      },
    },
    select: {
      fromTime: true,
      tillTime: true,
      id: true,
      User: {
        select: {
          grantEmail: true,
          grantId: true,
          timeZone: true,
        },
      },
    },
  });

  const nylasCalendarData = await nylas.calendars.getFreeBusy({
    identifier: data?.User.grantId as string,
    requestBody: {
      startTime: Math.floor(startOfDay.getTime() / 1000),
      endTime: Math.floor(endOfDay.getTime() / 1000),
      emails: [data?.User.grantEmail as string],
    },
  });

  let nylasCalendar = await nylas.calendars.list({
    identifier: data?.User.grantId as string,    
  })

  nylasCalendar = nylasCalendar.data.find(calendar => calendar.grantId === data?.User.grantId);
  const calendarTimezone = nylasCalendar.timeZone;

  // nylas.calendars.

  console.log("user grantId", data?.User.grantId)
  console.log("nylas calendar is", nylasCalendar)
  console.log("nylasCalendarData",JSON.stringify(nylasCalendarData))
  return { data, nylasCalendarData, calendarTimezone};
}

function calculateAvailableTimeSlots(
  dbAvailability: {
    fromTime: string | undefined;
    tillTime: string | undefined;
  },
  nylasData: NylasResponse<GetFreeBusyResponse[]>,
  date: string,
  duration: number,
  nylasCalendarTimezone: string,
  selectedTimezone: string
) {
  const now = new Date(); // Get the current time

  // Convert DB availability to Date objects
  const availableFrom = parse(
    `${date} ${dbAvailability.fromTime}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );
  const availableTill = parse(
    `${date} ${dbAvailability.tillTime}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );

  // Extract busy slots from Nylas data
  const busySlots = nylasData.data[0].timeSlots.map((slot: any) => ({
    start: fromUnixTime(slot.startTime),
    end: fromUnixTime(slot.endTime),
  }));

  // Generate all possible 30-minute slots within the available time
  const allSlots = [];
  let currentSlot = availableFrom;
  while (isBefore(currentSlot, availableTill)) {
    allSlots.push(currentSlot);
    currentSlot = addMinutes(currentSlot, duration);
  }

  // Filter out busy slots and slots before the current time
  const freeSlots = allSlots.filter((slot) => {
    const slotEnd = addMinutes(slot, duration);
    return (
      isAfter(slot, now) && // Ensure the slot is after the current time
      !busySlots.some(
        (busy: { start: any; end: any }) =>
          (!isBefore(slot, busy.start) && isBefore(slot, busy.end)) ||
          (isAfter(slotEnd, busy.start) && !isAfter(slotEnd, busy.end)) ||
          (isBefore(slot, busy.start) && isAfter(slotEnd, busy.end))
      )
    );
  });

  console.log("freeSlots", freeSlots, selectedTimezone)
  // Format the free slots
  return freeSlots.map((slot) => {
    console.log("selected Timezone",selectedTimezone)    
    console.log("Formatting structure is",slot,"-------", format(slot, "HH:mm"), "-----------", formatInTimeZone(slot, "HH:mm", { timeZone: "America/Los_Angeles" })," -------------", format(toZonedTime(slot, selectedTimezone), "HH:mm"))
    return format(toZonedTime(slot, selectedTimezone), "HH:mm")
  });
}

export async function TimeSlots({
  selectedDate,
  userName,
  meetingDuration,
  selectedTimezone,
}: iappProps) {
  const { data, nylasCalendarData, nylasCalendarTimezone } = await getAvailability(
    selectedDate,
    userName
  );
  

  console.log("selectedTimezone in timeslots.tsx ",selectedTimezone)
  
  const dbAvailability = { fromTime: data?.fromTime, tillTime: data?.tillTime };
  
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const availableSlots = calculateAvailableTimeSlots(
    dbAvailability,
    nylasCalendarData,
    formattedDate,
    meetingDuration,
    nylasCalendarTimezone,
    selectedTimezone 
  );
  console.log("availableSlots", availableSlots)
  return (
    <div>
      <p className="text-base font-semibold">
        {format(selectedDate, "EEE")}.{" "}
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "MMM. d")}
        </span>
      </p>

      <div className="mt-3 max-h-[350px] overflow-y-auto">
        {availableSlots.length > 0 ? (
          availableSlots.map((slot, index) => (
            <Link
              key={index}
              href={`?date=${format(selectedDate, "yyyy-MM-dd")}&time=${slot}`}
            >
              <Button variant="outline" className="w-full mb-2">
                {slot}
              </Button>
            </Link>
          ))
        ) : (
          <p>No available time slots for this date.</p>
        )}
      </div>
    </div>
  );
}
