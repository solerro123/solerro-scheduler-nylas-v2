"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { SubmitButton } from "../SubmitButton";
import { useFormState } from "react-dom";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { eventTypeSchema } from "@/app/lib/zodSchemas";
import { EditEventTypeAction } from "@/app/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { useEffect, useState } from "react";

interface iAppProps {
  id: string;
  title: string;
  url: string;
  description: string;
  duration: number;
  callProvider: string;
  serviceArea: string;
}

type Platform = "None" | "Zoom Meeting" | "Google Meet" | "Microsoft Teams";
import { USState, usStates } from "@/app/components/constants/serviceArea";



export function EditEventTypeForm({
  description,
  duration,
  title,
  url,
  callProvider,
  id,
  serviceArea
}: iAppProps) {

    console.log("serviceArea",serviceArea)



    // Example of a function that gets occupied service areas
    const [serviceAreas, setServiceAreas] = useState<string[]>([]); // Initializing as an array of strings

    // Example of a function that gets occupied service areas
    const getOccupiedServiceArea = async (): Promise<string[]> => {
      try {
        const response = await fetch("/api/getOccupiedServiceArea"); // API call to get occupied service areas
        if (!response.ok) {
          throw new Error("Failed to fetch service areas");
        }
        const data: { serviceArea: string }[] = await response.json(); // Assume the response is an array of objects
        // Extract just the 'serviceArea' values from the array of objects
        const states = data.map((item) => item.serviceArea);
        return states;
      } catch (error: any) {
        console.error("Error fetching service areas:", error.message);
        return [];
      }
    };
    useEffect(() => {
      const fetchAndUpdateServiceAreas = async () => {
        const occupiedServiceAreas = await getOccupiedServiceArea();
        // Filter out the service areas that are already occupied
        const updatedServiceAreas = usStates.filter(
          (state) => !occupiedServiceAreas.includes(state)
        );
        updatedServiceAreas.push(serviceArea as USState)
        setServiceAreas(updatedServiceAreas); // Update the state with filtered service areas
        console.log(updatedServiceAreas)
      };
  
      fetchAndUpdateServiceAreas();
  
    }, []); // Empty dependency array, this runs once when the component mounts
  

      // const [searchText, setSearchText] = useState("");
  const [selectedState, setSelectedState] = useState(String(serviceArea) || 'AK');

  const handleStateChange = (value: string) => {
    setSelectedState(value);
  };





  const [lastResult, action] = useFormState(EditEventTypeAction, undefined);
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: eventTypeSchema });
    },

    // Validate the form on blur event triggered
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });
  const [activePlatform, setActivePlatform] = useState<Platform>(
    callProvider as Platform
  );

  const togglePlatform = (platform: Platform) => {
    setActivePlatform(platform);
  };
  return (
    <div className="h-full w-full flex-1 flex flex-col items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Add new appointment type</CardTitle>
          <CardDescription>
            Create a new appointment type that allows people to book times.
          </CardDescription>
        </CardHeader>
        <form noValidate id={form.id} onSubmit={form.onSubmit} action={action}>
          <input type="hidden" name="id" value={id} />
          <CardContent className="grid gap-y-5">
            <div className="flex flex-col gap-y-2">
              <Label>Title</Label>
              <Input
                name={fields.title.name}
                key={fields.title.key}
                defaultValue={title}
                placeholder="30 min meeting"
              />
              <p className="text-red-500 text-sm">{fields.title.errors}</p>
            </div>

            <div className="grid gap-y-2 ">
              <Label>Url</Label>
              <div className="flex rounded-md">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-muted bg-muted text-muted-foreground text-sm">
                 SolerroScheduler.com/
                </span>
                <Input
                  type="text"
                  key={fields.url.key}
                  defaultValue={url}
                  name={fields.url.name}
                  placeholder="example-user-1"
                  className="rounded-l-none"
                />
              </div>

              <p className="text-red-500 text-sm">{fields.url.errors}</p>
            </div>

            <div className="grid gap-y-2">
              <Label>Description</Label>
              <Textarea
                name={fields.description.name}
                key={fields.description.key}
                defaultValue={description}
                placeholder="30 min meeting"
              />
              <p className="text-red-500 text-sm">
                {fields.description.errors}
              </p>
            </div>

            <div className="grid gap-y-2">
              <Label>Duration</Label>
              <Select
                name={fields.duration.name}
                key={fields.duration.key}
                defaultValue={String(duration)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select the duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Duration</SelectLabel>
                    <SelectItem value="15">15 Mins</SelectItem>
                    <SelectItem value="30">30 Min</SelectItem>
                    <SelectItem value="45">45 Mins</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <p className="text-red-500 text-sm">{fields.duration.errors}</p>
            </div>



{/* State Select */}
<div className="grid gap-y-2">
              <Label>State</Label>
              <Select
                name={fields.serviceArea.name}
                key={fields.serviceArea.key}
                value={selectedState} // Bind the selected value to state
                onValueChange={handleStateChange} // Update state when the value changes
                
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>State</SelectLabel>
                    {serviceAreas.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-red-500 text-sm">{fields.serviceArea.errors}</p>
            </div>



            <div className="grid gap-y-2">
              <input
                type="hidden"
                name={fields.videoCallSoftware.name}
                value={activePlatform}
              />
              <Label>Video Call Provider</Label>
              <ButtonGroup className="w-full">
                <Button
                  onClick={() => togglePlatform("Zoom Meeting")}
                  type="button"
                  className="w-full"
                  variant={
                    activePlatform === "Zoom Meeting" ? "secondary" : "outline"
                  }
                >
                  Zoom
                </Button>
                <Button
                  onClick={() => togglePlatform("Google Meet")}
                  type="button"
                  className="w-full"
                  variant={
                    activePlatform === "Google Meet" ? "secondary" : "outline"
                  }
                >
                  Google Meet
                </Button>
                <Button
                  variant={
                    activePlatform === "Microsoft Teams"
                      ? "secondary"
                      : "outline"
                  }
                  type="button"
                  className="w-full"
                  onClick={() => togglePlatform("Microsoft Teams")}
                >
                  Microsoft Teams
                </Button>
              </ButtonGroup>
            </div>
          </CardContent>
          <CardFooter className="w-full flex justify-between">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <SubmitButton text="Edit Event Type" />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
