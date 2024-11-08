"use client";

import { useState } from "react";
import { SettingsAction } from "@/app/actions";
import { aboutSettingsSchema } from "@/app/lib/zodSchemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useFormState } from "react-dom";
import { SubmitButton } from "../SubmitButton";
import { UploadDropzone } from "@/app/lib/uploadthing";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface iAppProps {
  fullName: string;
  email: string;
  profileImage: string;
  existingTimeZone: string;
}

import { timeZones } from "../constants/timeZones";

export function SettingsForm({ fullName, email, profileImage, existingTimeZone }: iAppProps) {
  
  const [timeZone, setTimeZone] = useState<string>(existingTimeZone);
  const [lastResult, action] = useFormState(SettingsAction, undefined);
  const [currentProfileImage, setCurrentProfileImage] = useState(profileImage);

  const handleTimeZoneChange = (value: string) => {
    setTimeZone(value);
  };

  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: aboutSettingsSchema });
    },

    // Validate the form on blur event triggered
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const handleDeleteImage = () => {
    setCurrentProfileImage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings.</CardDescription>
      </CardHeader>
      <form noValidate id={form.id} onSubmit={form.onSubmit} action={action}>
        <CardContent className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <Label>Full Name</Label>
            <Input
              name={fields.fullName.name}
              key={fields.fullName.key}
              placeholder="Jan Marshall"
              defaultValue={fullName}
            />
            <p className="text-red-500 text-sm">{fields.fullName.errors}</p>
          </div>
          <div className="flex flex-col gap-y-2">
            <Label>Email</Label>
            <Input disabled placeholder="Jan Marshall" defaultValue={email} />
          </div>

          {/* State Select */}
          <div className="grid gap-y-2">
              <Label>State</Label>
              <Select
                name={fields.timezone.name}
                key={fields.timezone.key}
                value={timeZone} // Bind the selected value to state
                onValueChange={handleTimeZoneChange} // Update state when the value changes
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>State</SelectLabel>
                    {timeZones.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-red-500 text-sm">{fields.timezone.errors}</p>
            </div>


          <div className="grid gap-y-5">
            <input
              type="hidden"
              name={fields.profileImage.name}
              key={fields.profileImage.key}
              value={currentProfileImage}
            />
            <Label>Profile Image</Label>
            {currentProfileImage ? (
              <div className="relative size-16">
                <Image
                  src={currentProfileImage}
                  alt="Profile"
                  width={300}
                  height={300}
                  className="rounded-lg size-16"
                />
                <Button
                  type="button"
                  onClick={handleDeleteImage}
                  variant="destructive"
                  size="icon"
                  className="absolute -top-3 -right-3"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="imageUploader"
                appearance={{
                  container: "border-muted",
                }}
                onClientUploadComplete={(res) => {
                  setCurrentProfileImage(res[0].url);
                  toast.success("Profile image uploaded");
                }}
                onUploadError={(error) => {
                  toast.error(error.message);
                }}
              />
            )}
            <p className="text-red-500 text-sm">{fields.profileImage.errors}</p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton text="Save Changes" />
        </CardFooter>
      </form>
    </Card>
  );
}
