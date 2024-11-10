// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use client";  // Ensures this component is rendered on the client side only

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming correct import path

// Helper function for formatting the timezone offset
const formatTimezoneOffset = (timezone: string) => {
  const date = new Date();
  const options = { timeZone: timezone, hour: "numeric", minute: "numeric" };
  return new Intl.DateTimeFormat("en-US", options).format(date);
};

const TimezoneSelector = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);

  // Set the initial timezone from the query parameter or default to the user's local timezone
  useEffect(() => {
    const initialTimezone = searchParams.get("timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;
    setSelectedTimezone(initialTimezone);
  }, [searchParams]);

  // Function to handle timezone change
  const handleTimezoneChange = (timezone: string) => {
    setSelectedTimezone(timezone);

    // Update the query parameter in the URL without reloading the page
    const newQueryParams = new URLSearchParams(searchParams);
    newQueryParams.set("timezone", timezone);

    // Ensure pathname is fetched from window.location if router.pathname is incorrect
    const pathname = window.location.pathname;

    // Update the URL with the new query parameters
    router.push(`${pathname}?${newQueryParams.toString()}`);
  };

  if (selectedTimezone === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <label htmlFor="timezone">Timezone</label>
      <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
        <SelectTrigger>
          <SelectValue>{selectedTimezone}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Intl.supportedValuesOf("timeZone").map((timezone) => (
            <SelectItem key={timezone} value={timezone}>
              {timezone} ({formatTimezoneOffset(timezone)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        <p>Selected Timezone: {selectedTimezone}</p>
      </div>
    </div>
  );
};

export default TimezoneSelector;
