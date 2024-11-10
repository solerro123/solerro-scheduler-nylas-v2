// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimezoneSelect } from "./timezone-select";
import { TimeSelect } from "./time-select";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, parse, setHours, setMinutes } from "date-fns";
import { Separator } from "@/components/ui/separator";

export function CalendarScheduler() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState("UTC");

  const getFullDateTime = () => {
    if (!date) return null;
    const [hours, minutes] = time.split(':').map(Number);
    return setMinutes(setHours(date, hours), minutes);
  };

  const handleSchedule = async () => {
    const dateTime = getFullDateTime();
    if (!dateTime) return;

    try {
      // Initialize Nylas scheduler here with your API key
      // const nylas = new Nylas({ apiKey: 'your-api-key' });
      
      const scheduledDateTime = format(dateTime, "PPp");
      console.log(`Scheduling for ${scheduledDateTime} in ${timezone}`);
      
      // Add your Nylas scheduling logic here
    } catch (error) {
      console.error("Scheduling failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          Schedule a Meeting
        </CardTitle>
        <CardDescription>
          Select your preferred date, time, and timezone for the meeting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
            />
            <div className="space-y-4">
              <TimeSelect value={time} onChange={setTime} />
              <TimezoneSelect value={timezone} onChange={setTimezone} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-6 border rounded-lg bg-muted/50 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Selected Schedule
              </h3>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Date: {date ? format(date, "PPP") : "No date selected"}
                </p>
                <p className="text-muted-foreground">
                  Time: {time}
                </p>
                <Separator className="my-2" />
                <p className="text-muted-foreground">
                  Timezone: {timezone}
                </p>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSchedule}
              disabled={!date}
            >
              Schedule Meeting
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}