// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { NextResponse } from 'next/server';
import { parse, addDays, addMinutes, parseISO, addMonths, startOfDay, endOfDay,  isBefore, isAfter } from "date-fns";
import prisma from "../../lib/db"; // Adjust the import path as needed
import { nylas } from "../../lib/nylas"; // Adjust the import path as needed
import { Prisma } from "@prisma/client";


import { format, set, eachMinuteOfInterval, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Helper function to convert a time string to a Date object in the given time zone
function parseTime(timeStr: string, date: Date, timeZone: string): Date {
  const dateTimeStr = `${format(date, 'yyyy-MM-dd')} ${timeStr}`;
  return zonedTimeToUtc(dateTimeStr, timeZone);
}

// Function to filter out busy times from available slots
function filterAvailableSlots(availableSlots, busyTimes) {
  return availableSlots.filter((slot) => {
    const slotTime = new Date(slot).getTime();

    // Check if this slot overlaps with any busy time
    return !busyTimes.some((busy) => {
      const busyStart = busy.startTime * 1000; // Convert to milliseconds
      const busyEnd = busy.endTime * 1000;     // Convert to milliseconds
      return slotTime >= busyStart && slotTime < busyEnd;
    });
  });
}

// Function to generate available slots excluding busy times
function generateAvailableSlots(availabilityData: any, timeZone: string): string[] {
  const availableSlots: string[] = [];
  const today = utcToZonedTime(new Date(), timeZone);
  const nextMonth = addDays(today, 15);  // End date: 1 month from today

  // Loop through each day from today to next month
  for (let currentDay = startOfDay(today); isBefore(currentDay, nextMonth); currentDay = addDays(currentDay, 1)) {
    const currentDayFormatted = format(currentDay, 'EEEE'); // Get the full day name (e.g., Monday)

    // Find matching availability for the current day
    const dayAvailability = availabilityData.find((slot: any) => slot.day.toLowerCase() === currentDayFormatted.toLowerCase() && slot.isActive);

    if (!dayAvailability) continue; // Skip if no availability for this day

    // Convert fromTime and tillTime from string to Date objects based on the timezone
    const startOfDaySlot = parseTime(dayAvailability.fromTime, currentDay, timeZone);
    const endOfDaySlot = parseTime(dayAvailability.tillTime, currentDay, timeZone);

    let currentTime = startOfDaySlot;

    // Generate slots in 30-minute intervals for the current day
    while (isBefore(currentTime, endOfDaySlot)) {
      // Format the available slot as ISO 8601 string in UTC
      // availableSlots.push(format(currentTime, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone }));
      availableSlots.push(currentTime);
      // Increment by 30 minutes
      currentTime = addMinutes(currentTime, 30);
    }
  }

  return availableSlots;
}


export async function GET(request: Request) {
  try {
    // Parse query params from the request
    const { serviceArea } = Object.fromEntries(new URL(request.url).searchParams.entries());

    // Ensure the parameters are provided
    if (!serviceArea) {
      return NextResponse.json(
        { error: "Missing userName or selectedDate query parameters" },
        { status: 400 }
      );
    }
    // Set the start and end of the day
    const startOfDayDate = new Date();
    const endOfDayDate = addMonths(startOfDayDate, 1);
    

    const eventType = await prisma.eventType.findFirst({
      where:{
        serviceArea: serviceArea
      },
      select:{        
        userId: true,
        id: true,
        duration: true
      }
    })

    if (!eventType) {
      const avaiableServiceAreas = await prisma.eventType.findMany({
        select: {
          serviceArea: true,
        },
        distinct: ['serviceArea'],
      });
      return NextResponse.json({ error: `This service area is not available. Here are avaialbel service areas:- ${JSON.stringify(avaiableServiceAreas)}` }, { status: 404 });
    }

    // Fetch user's availability data from Prisma
    const data = await prisma.user.findFirst({
      where: {
        id: eventType?.userId
      },
      select: {
        Availability: true,
        username:true,
        grantId: true,
        grantEmail: true,
        timeZone: true
      },
    });

    if (!data) {
      return NextResponse.json({ error: "No availability found for the user" }, { status: 404 });
    }

    // Fetch free/busy data from Nylas
    const nylasCalendarData = await nylas.calendars.getFreeBusy({
      identifier: data?.grantId,
      requestBody: {
        startTime: Math.floor(startOfDayDate.getTime() / 1000),
        endTime: Math.floor(endOfDayDate.getTime() / 1000),
        emails: [data?.grantEmail],
      },
    });

    // Fetch Nylas calendar data to retrieve timezone information
    let nylasCalendar = await nylas.calendars.list({
      identifier: data.grantId,
    });


    nylasCalendar = nylasCalendar.data.find(calendar => calendar.grantId === data.grantId);
    // console.log("calendar deatils ", nylasCalendar);
    const calendarTimezone = nylasCalendar?.timezone || "UTC"; // Default to UTC if timezone is not found

    // // Log and return the results
    // console.log("User grantId:", data.grantId);
    // console.log("Nylas Calendar Data:", JSON.stringify(nylasCalendarData));

    // console.log("username is ", userName)
    // Convert busy time data to the required timezone
    // // const busyTimes = convertBusyTimes(nylasCalendarData.data[0].timeSlots, calendarTimezone);
    // console.log("nylasCalendarData.data[0].timeSlots:- ", nylasCalendarData.data[0].timeSlots)
    // console.log("availableTimes", data)
    
    const availableTimeSlots = generateAvailableSlots(data.Availability, calendarTimezone);

    const filteredSlots = filterAvailableSlots(availableTimeSlots, nylasCalendarData.data[0].timeSlots);
    // console.log("availability is ", availableTimeSlots)
    // console.log("timezone ", calendarTimezone)


    return NextResponse.json({
      filteredSlots:filteredSlots,
      username:data.username,
      eventTypeId: eventType.id,
      meetingLength: eventType.duration
      // availableTimeSlots,
      // data,
      // nylasCalendarData,
      // calendarTimezone,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
