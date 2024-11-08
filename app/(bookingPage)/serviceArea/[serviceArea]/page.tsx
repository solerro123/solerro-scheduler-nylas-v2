import { createMeetingAction } from "@/app/actions";
import { RenderCalendar } from "@/app/components/demo/RenderCalendar";
import { SubmitButton } from "@/app/components/SubmitButton";
import { TimeSlots } from "@/app/components/TimeSlots";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/prisma";
// import { format } from "date-fns";
import { BookMarked, CalendarX2, Clock } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import React from "react";

async function getData(serviceArea: string) {
  const eventType = await prisma.eventType.findFirst({
    where: {
      serviceArea: serviceArea,      
      active: true,
    },
    select: {
      id: true,
      description: true,
      title: true,
      duration: true,
      videoCallSoftware: true,

      user: {
        select: {
          image: true,
          name: true,
          id:true,
          username: true,
          Availability: {
            select: {
              day: true,
              isActive: true,
            },
          },
        },
      },
    },
  });
  // console.log(eventType)

  if (!eventType) {
    return notFound();
  }

  return eventType;
}

const BookingPage = async ({
  params,
  searchParams,
}: {
  params: { serviceArea: string};
  searchParams: { date?: string; time?: string; firstName?: string; lastName?: string; electricalPanelsOnSite?: string, animals?: string };
}) => {
  const selectedDate = searchParams.date
    ? new Date(searchParams.date)
    : new Date();

  
  const eventType = await getData(params.serviceArea);
  console.log(eventType.user.username)
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedDate);

  const showForm = !!searchParams.date && !!searchParams.time;

  return (
    <div className="min-h-screen w-screen flex items-center justify-center">
      {showForm ? (
        <Card className="max-w-[1000px]">
          <CardContent className="p-5 grid md:grid-cols-[1fr,auto,1fr] gap-4">
            <div>
              <Image
                src={eventType.user.image as string}
                alt={`${eventType.user.name}'s profile picture`}
                className="size-9 rounded-full"
                width={30}
                height={30}
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {eventType.user.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{eventType.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {eventType.description}
              </p>

              <div className="mt-5 grid gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {eventType.duration} Mins
                  </span>
                </p>
                <p className="flex items-center">
                  <BookMarked className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {eventType.videoCallSoftware}
                  </span>
                </p>
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="hidden md:block h-full w-[1px]"
            />

            <form
              className="flex flex-col gap-y-4"
              action={createMeetingAction}
            >
              <input type="hidden" name="eventTypeId" value={eventType.id} />
              <input type="hidden" name="username" value={eventType.user.username || ''} />
              <input type="hidden" name="fromTime" value={searchParams.time} />
              <input type="hidden" name="eventDate" value={searchParams.date} />
              <input
                type="hidden"
                name="meetingLength"
                value={eventType.duration}
              />
              <div className="flex flex-col gap-y-1">
                <Label>First Name</Label>
                <Input name="firstName" placeholder="First Name" defaultValue={searchParams.firstName || ""}  />
              </div>


              <div className="flex flex-col gap-y-1">
                <Label>Last Name</Label>
                <Input name="lastName" placeholder="Last Name" defaultValue={searchParams.lastName || ""}  />
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Your Email</Label>
                <Input name="email" placeholder="johndoe@gmail.com" />
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>How many Levels</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="level" value="One" /> One
                  </label>
                  <label>
                    <input type="radio" name="level" value="Two" /> Two
                  </label>
                  <label>
                    <input type="radio" name="level" value="Three" /> Three
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Attic Access</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="atticAccess" value="In Garage" /> In Garage
                  </label>
                  <label>
                    <input type="radio" name="atticAccess" value="In Bedroom" /> In Bedroom
                  </label>
                  <label>
                    <input type="radio" name="atticAccess" value="In Hallway" /> In Hallway
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Type Of Mount</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="typeOfMount" value="In Garage" /> Roof Mount
                  </label>
                  <label>
                    <input type="radio" name="typeOfMount" value="In Bedroom" /> Ground Mount
                  </label>
                  <label>
                    <input type="radio" name="typeOfMount" value="In Hallway" /> Both
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Meters On Site</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="metersOnSite" value="One" /> One
                  </label>
                  <label>
                    <input type="radio" name="metersOnSite" value="Two" /> Two
                  </label>
                  <label>
                    <input type="radio" name="metersOnSite" value="Three" /> Three
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Electrical Panels On Site</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="electricalPanelsOnSite" value="One" /> One
                  </label>
                  <label>
                    <input type="radio" name="electricalPanelsOnSite" value="Two" /> Two
                  </label>
                  <label>
                    <input type="radio" name="electricalPanelsOnSite" value="Three" /> Three
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Animals</Label>
                <div className="flex gap-x-4">
                  <label>
                    <input type="radio" name="animals" value="Dogs" defaultChecked={searchParams.animals === "Dogs"} /> Dogs
                  </label>
                  <label>
                    <input type="radio" name="animals" value="Cats" defaultChecked={searchParams.animals === "Cats"} /> Cats
                  </label>
                  <label>
                    <input type="radio" name="animals" value="Both" defaultChecked={searchParams.animals === "Both"} /> Both
                  </label>
                  <label>
                    <input type="radio" name="animals" value="None" defaultChecked={searchParams.animals === "None"} /> None
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-y-1">
                <Label>Notes to Installer from Sales Rep</Label>
                <textarea
                  name="noteToInstallerFromSalesRep"
                  placeholder="Enter any additional notes here..."
                  className="border rounded-md p-2"
                />
              </div>

              <SubmitButton text="Book Meeting" />
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-[1000px] mx-auto">
          <CardContent className="p-5 md:grid md:grid-cols-[1fr,auto,1fr,auto,1fr] md:gap-4">
            <div>
              <Image
                src={eventType.user.image as string}
                alt={`${eventType.user.name}'s profile picture`}
                className="size-9 rounded-full"
                width={30}
                height={30}
              />
              <p className="text-sm font-medium text-muted-foreground mt-1">
                {eventType.user.name}
              </p>
              <h1 className="text-xl font-semibold mt-2">{eventType.title}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                {eventType.description}
              </p>
              <div className="mt-5 grid gap-y-3">
                <p className="flex items-center">
                  <CalendarX2 className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formattedDate}
                  </span>
                </p>
                <p className="flex items-center">
                  <Clock className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {eventType.duration} Mins
                  </span>
                </p>
                <p className="flex items-center">
                  <BookMarked className="size-4 mr-2 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Google Meet
                  </span>
                </p>
              </div>
            </div>

            <Separator
              orientation="vertical"
              className="hidden md:block h-full w-[1px]"
            />

            <div className="my-4 md:my-0">
              <RenderCalendar daysofWeek={eventType.user.Availability} />
            </div>

            <Separator
              orientation="vertical"
              className="hidden md:block h-full w-[1px]"
            />

            <TimeSlots
              selectedDate={selectedDate}
              userName={eventType.user.username || ''}
              meetingDuration={eventType.duration}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingPage;
