// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
"use server";

import { parseWithZod } from "@conform-to/zod";
import prisma from "./lib/db";
import { requireUser } from "./lib/hooks";
import {
  aboutSettingsSchema,
  eventTypeSchema,
  EventTypeServerSchema,
  onboardingSchema,
} from "./lib/zodSchemas";
import { redirect } from "next/navigation";

import { revalidatePath } from "next/cache";
import { nylas } from "./lib/nylas";
import { sub } from "date-fns";
import { Console } from "console";

export async function onboardingAction(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = await parseWithZod(formData, {
    schema: onboardingSchema({
      async isUsernameUnique() {
        const exisitngSubDirectory = await prisma.user.findUnique({
          where: {
            username: formData.get("username") as string,
          },
        });
        return !exisitngSubDirectory;
      },
    }),

    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const OnboardingData = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      username: submission.value.username,
      name: submission.value.fullName,
      Availability: {
        createMany: {
          data: [
            {
              day: "Monday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Tuesday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Wednesday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Thursday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Friday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Saturday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
            {
              day: "Sunday",
              fromTime: "08:00",
              tillTime: "18:00",
            },
          ],
        },
      },
    },
  });
  return redirect("/onboarding/grant-id");
}

export async function SettingsAction(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, {
    schema: aboutSettingsSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const user = await prisma.user.update({
    where: {
      id: session.user?.id as string,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
      timeZone: submission.value.timezone,
    },
  });

  return redirect("/dashboard");
}

export async function CreateEventTypeAction(
  prevState: any,
  formData: FormData
) {
  const session = await requireUser();

  const submission = await parseWithZod(formData, {
    schema: EventTypeServerSchema({
      async isUrlUnique() {
        const data = await prisma.eventType.findFirst({
          where: {
            userId: session.user?.id,
            url: formData.get("url") as string,
          },
        });
        return !data;
      },
    }),

    async: true,
  });
  if (submission.status !== "success") {
    return submission.reply();
  }
  try {
    const data = await prisma.eventType.create({
      data: {
        title: submission.value.title,
        duration: submission.value.duration,
        url: submission.value.url,
        description: submission.value.description,
        userId: session.user?.id as string,
        videoCallSoftware: submission.value.videoCallSoftware,
        serviceArea: submission.value.serviceArea
      },
    });
    return redirect("/dashboard");
  }
  catch (e) {
    // Log error and provide a better response
    console.error("Error while creating event type:", e);
    return {
      error: "There was an error while creating the event type. Please try again later.",
    };
  }

}

export async function EditEventTypeAction(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = await parseWithZod(formData, {
    schema: EventTypeServerSchema({
      async isUrlUnique() {
        const data = await prisma.eventType.findFirst({
          where: {
            userId: session.user?.id,
            url: formData.get("url") as string,
          },
        });
        return !data;
      },
    }),

    async: true,
  });
  if (submission.status !== "success") {
    return submission.reply();
  }
  const data = await prisma.eventType.update({
    where: {
      id: formData.get("id") as string,
      userId: session.user?.id as string,
    },
    data: {
      title: submission.value.title,
      duration: submission.value.duration,
      url: submission.value.url,
      description: submission.value.description,
      videoCallSoftware: submission.value.videoCallSoftware,
      serviceArea: submission.value.serviceArea
    },
  });
  return redirect("/dashboard");
}

export async function DeleteEventTypeAction(formData: FormData) {
  const session = await requireUser();

  const data = await prisma.eventType.delete({
    where: {
      id: formData.get("id") as string,
      userId: session.user?.id as string,
    },
  });

  return redirect("/dashboard");
}

export async function updateEventTypeStatusAction(
  prevState: any,
  {
    eventTypeId,
    isChecked,
  }: {
    eventTypeId: string;
    isChecked: boolean;
  }
) {
  try {
    const session = await requireUser();

    const data = await prisma.eventType.update({
      where: {
        id: eventTypeId,
        userId: session.user?.id as string,
      },
      data: {
        active: isChecked,
      },
    });

    revalidatePath(`/dashboard`);
    return {
      status: "success",
      message: "EventType Status updated successfully",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export async function updateAvailabilityAction(formData: FormData) {
  const session = await requireUser();

  const rawData = Object.fromEntries(formData.entries());
  const availabilityData = Object.keys(rawData)
    .filter((key) => key.startsWith("id-"))
    .map((key) => {
      const id = key.replace("id-", "");
      return {
        id,
        isActive: rawData[`isActive-${id}`] === "on",
        fromTime: rawData[`fromTime-${id}`] as string,
        tillTime: rawData[`tillTime-${id}`] as string,
      };
    });

  try {
    await prisma.$transaction(
      availabilityData.map((item) =>
        prisma.availability.update({
          where: { id: item.id },
          data: {
            isActive: item.isActive,
            fromTime: item.fromTime,
            tillTime: item.tillTime,
          },
        })
      )
    );

    revalidatePath("/dashboard/availability");
    return { status: "success", message: "Availability updated successfully" };
  } catch (error) {
    console.error("Error updating availability:", error);
    return { status: "error", message: "Failed to update availability" };
  }
}

export async function createMeetingAction(formData: FormData) {
  const getUserData = await prisma.user.findUnique({
    where: {
      username: formData.get("username") as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if (!getUserData) {
    throw new Error("User not found");
  }

  const eventTypeData = await prisma.eventType.findUnique({
    where: {
      id: formData.get("eventTypeId") as string,
    },
    select: {
      title: true,
      description: true,
    },
  });

  const contact = await prisma.contacts.findFirst({
    where: {
      email: formData.get("email")?.toString().toLowerCase() as string,
    },
    select: {
      email: true
    }
  })

  if (contact) {
    await prisma.contacts.update({
      where: {
        email: formData.get("email")?.toString().toLowerCase() as string,
      },
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        howmanyLevels: formData.get("howmanyLevels")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSR")?.toString().toLowerCase()
      },
    });
  } else {
    await prisma.contacts.create({
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        email: formData.get("email")?.toString().toLowerCase() || "deepeshnfs462@gmail.com",
        howmanyLevels: formData.get("level")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSalesRep")?.toString().toLowerCase()
      }
    })
  }
  console.log("contact:- ", contact)

  const formTime = formData.get("fromTime") as string;
  const meetingLength = Number(formData.get("meetingLength"));
  const eventDate = formData.get("eventDate") as string;

  const startDateTime = new Date(`${eventDate}T${formTime}:00`);

  // Calculate the end time by adding the meeting length (in minutes) to the start time
  const endDateTime = new Date(startDateTime.getTime() + meetingLength * 60000);

  await nylas.events.create({
    identifier: getUserData?.grantId as string,
    requestBody: {
      title: eventTypeData?.title,
      description: eventTypeData?.description,
      when: {
        startTime: Math.floor(startDateTime.getTime() / 1000),
        endTime: Math.floor(endDateTime.getTime() / 1000),
      },
      conferencing: {
        autocreate: {},
        provider: "Google Meet",
      },
      participants: [
        {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          status: "yes",
        },
      ],
    },
    queryParams: {
      calendarId: getUserData?.grantEmail as string,
      notifyParticipants: true,
    },
  });

  return redirect(`/success`);
}

export async function cancelMeetingAction(formData: FormData) {
  const session = await requireUser();

  const userData = await prisma.user.findUnique({
    where: {
      id: session.user?.id as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if (!userData) {
    throw new Error("User not found");
  }

  const data = await nylas.events.destroy({
    eventId: formData.get("eventId") as string,
    identifier: userData?.grantId as string,
    queryParams: {
      calendarId: userData?.grantEmail as string,
    },
  });

  revalidatePath("/dashboard/meetings");
}

export async function getOccupiedServiceArea() {
  const eventTypes = await prisma.eventType.findMany({
    where: {
      OR: [
        { serviceArea: { not: "" } },  // Exclude empty strings
        { serviceArea: null },          // Include null values
      ],
      active: true,  // Filter by active status
    },
    select: {
      serviceArea: true,  // Select only the serviceArea field
    },
  });
  return eventTypes;
}

export const haversineDistance = async (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  return distance;
};

// Function to get the time zone from Google Maps Time Zone API
export const getTimeZone = async (apiKey: string, lat: number, lng: number) => {

  // return Intl.DateTimeFormat().resolvedOptions().timeZone
  const timestamp = Date.now() / 1000; // Current timestamp in seconds
  // const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your API key
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`;
  console.log(url)
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK") {
      return data.timeZoneId; // Return the time zone ID, e.g., "America/Chicago"
    } else {
      throw new Error("Unable to fetch time zone");
    }
  } catch (error) {
    console.error("Error fetching time zone:", error);
    return "Unknown Time Zone";
  }
};

const formDataToObject = async (formData: FormData) => {
  const object = {};
  formData.forEach((value:any, key:string) => {
    object[key] = value;
  });
  return object;
};

export async function createMeetingActionSiteSurvey(formData: FormData) {
  const getUserData = await prisma.user.findUnique({
    where: {
      username: formData.get("username") as string,
    },
    select: {
      grantEmail: true,
      grantId: true,
    },
  });

  if (!getUserData) {
    throw new Error("User not found");
  }

  const eventTypeData = await prisma.eventType.findUnique({
    where: {
      id: formData.get("eventTypeId") as string,
    },
    select: {
      title: true,
      description: true,
    },
  });

  const contact = await prisma.contacts.findFirst({
    where: {
      email: formData.get("email")?.toString().toLowerCase() as string,
    },
    select: {
      email: true
    }
  })

  if (contact) {
    await prisma.contacts.update({
      where: {
        email: formData.get("email")?.toString().toLowerCase() as string,
      },
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        howmanyLevels: formData.get("howmanyLevels")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSR")?.toString().toLowerCase()
      },
    });
  }else {
    await prisma.contacts.create({
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        email: formData.get("email")?.toString().toLowerCase() || "deepeshnfs462@gmail.com",
        howmanyLevels: formData.get("level")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSalesRep")?.toString().toLowerCase()
      }
    })
  }
  // console.log("contact:- ", contact)

  const meetingLength = Number(formData.get("meetingLength"));
  const requestTime = formData.get("dateTime") as string;
  console.log("requestTime requestTime ", requestTime)
  const startDateTime = new Date(requestTime);

  // Calculate the end time by adding the meeting length (in minutes) to the start time
  const endDateTime = new Date(startDateTime.getTime() + meetingLength * 60000);

  const description = eventTypeData?.description;
  // formData.forEach((value, key) => {
  //   description += `${key}: ${value}\n`; // Add each field and its value to the description
  // });
  console.log("startDateTime", startDateTime, endDateTime)
  const name = `${formData.get("firstName")} ${formData.get("lastName")}`
  // return
  const status = await nylas.events.create({
    identifier: getUserData?.grantId as string,
    requestBody: {
      title: eventTypeData?.title,
      description: description,
      when: {
        startTime: Math.floor(startDateTime.getTime() / 1000),
        endTime: Math.floor(endDateTime.getTime() / 1000),
      },
      conferencing: {
        autocreate: {},
        provider: "Google Meet",
      },
      participants: [
        {
          name: name as string,
          email: formData.get("email") as string,
          status: "yes",
        },
      ],
    },
    queryParams: {
      calendarId: getUserData?.grantEmail as string,
      notifyParticipants: true,
    },
  });

  
  const formDataAsJson = await formDataToObject(formData)
  console.log("formDataAsJson:- ", formDataAsJson)
  await fetch('https://hooks.zapier.com/hooks/catch/19704808/25gk583/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Set content type to JSON if you're sending JSON data
    },
    body: JSON.stringify({ formData: formDataAsJson }), // Pass the data in the body
  });
  // return
  return redirect(`/success`);
}


export async function createMeetingActionEnSiteSurvey(formData: FormData) {

  const contact = await prisma.contacts.findFirst({
    where: {
      email: formData.get("email")?.toString().toLowerCase() as string,
    },
    select: {
      email: true
    }
  })

  if (contact) {
    await prisma.contacts.update({
      where: {
        email: formData.get("email")?.toString().toLowerCase() as string,
      },
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        howmanyLevels: formData.get("howmanyLevels")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSR")?.toString().toLowerCase()
      },
    });
  } else {
    await prisma.contacts.create({
      data: {
        firstName: formData.get("firstName")?.toString().toLowerCase(),
        lastName: formData.get("lastName")?.toString().toLowerCase(),
        email: formData.get("email")?.toString().toLowerCase() || "deepeshnfs462@gmail.com",
        howmanyLevels: formData.get("level")?.toString().toLowerCase(),
        atticAccess: formData.get("atticAccess")?.toString().toLowerCase(),
        typeOfMount: formData.get("typeOfMount")?.toString().toLowerCase(),
        metersOnSite: formData.get("metersOnSite")?.toString().toLowerCase(),
        electricalPanelsOnSite: formData.get("electricalPanelsOnSite")?.toString().toLowerCase(),
        animals: formData.get("animals")?.toString().toLowerCase(),
        noteToInstallerFromSR: formData.get("noteToInstallerFromSalesRep")?.toString().toLowerCase()
      }
    })
  }
  const formDataAsJson = await formDataToObject(formData)
  console.log("formDataAsJson:- ", formDataAsJson)
  await fetch('https://hooks.zapier.com/hooks/catch/19704808/25gk583/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', // Set content type to JSON if you're sending JSON data
    },
    body: JSON.stringify({ formData: formDataAsJson }), // Pass the data in the body
  });

  return redirect(`/success?type=Ensite`);
}
