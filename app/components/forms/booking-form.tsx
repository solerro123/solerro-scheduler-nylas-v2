import { SubmitButton } from "@/app/components/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

const BookingForm = ({ eventType, searchParams = {}, bookingFormData, setBookingFormData, bookingFormFilled, setBookingFormFilled }: any) => {

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingFormFilled(true); // This will set the booking form state to true when the form is submitted
    // You could submit bookingFormData here if necessary
    // console.log("form data is ", bookingFormData);
    // console.log("Form Submitted", bookingFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingFormData((prevState: any) => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    // console.log("searchParams:-  ",searchParams)

    // Only update the state if the bookingFormData is not already populated
    //console.log("bookingFormData", bookingFormData)
    setBookingFormData((prevState: any) => {
      if (Object.keys(prevState).length === 0) { // Check if the form data is empty
        return {
          firstName: searchParams.firstName || prevState.firstName,
          lastName: searchParams.lastName || prevState.lastName,
          email: searchParams.email || prevState.email,
          salesRepName: searchParams.salesRepName || prevState.salesRepName,
          level: searchParams.level, // Default level          
          atticAccess: searchParams.atticAccess || "", // Default atticAccess
          typeOfMount: searchParams.typeOfMount || "Roof Mount", // Default typeOfMount
          metersOnSite: searchParams.metersOnSite || "One", // Default metersOnSite
          electricalPanelsOnSite: searchParams.electricalPanelsOnSite || "One", // Default electricalPanelsOnSite
          animals: searchParams.animals || "None", // Default animals
          noteToInstallerFromSalesRep: searchParams.noteToInstallerFromSalesRep || "",
        };
      }
      return prevState;
    });
  }, [searchParams, setBookingFormData]); // Add setBookingFormData to the dependency array to prevent unnecessary re-renders

  return (
    <form className="flex flex-col gap-y-4" action="/create-meeting-action" onSubmit={handleFormSubmit}>
      <input type="hidden" name="eventTypeId" value={eventType.id || searchParams.eventTypeId} required />
      <input type="hidden" name="username" value={eventType.username || searchParams.username || ''} required />
      <input type="hidden" name="fromTime" value={searchParams.time || ''} required />
      <input type="hidden" name="eventDate" value={searchParams.date || ''} required />
      <input type="hidden" name="meetingLength" value={eventType.duration || searchParams.meetingLength || ''} required />

      <div className="flex flex-col gap-y-1">
        <Label>Customer First Name</Label>
        <Input
          name="firstName"
          placeholder="Customer First Name"
          value={bookingFormData.firstName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Customer Last Name</Label>
        <Input
          name="lastName"
          placeholder="Customer Last Name"
          value={bookingFormData.lastName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Customer Email</Label>
        <Input
          name="email"
          placeholder="johndoe@gmail.com"
          value={bookingFormData.email}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Sales Rep Name</Label>
        <Input
          name="salesRepName"
          placeholder="johndoe@gmail.com"
          value={bookingFormData.salesRepName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>How many Levels</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="level"
              value="One"
              checked={bookingFormData.level === "One"}
              onChange={handleInputChange}
              required
            /> One
          </label>
          <label>
            <input
              type="radio"
              name="level"
              value="Two"
              checked={bookingFormData.level === "Two"}
              onChange={handleInputChange}
            /> Two
          </label>
          <label>
            <input
              type="radio"
              name="level"
              value="Three"
              checked={bookingFormData.level === "Three"}
              onChange={handleInputChange}
            /> Three
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Attic Access</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="atticAccess"
              value="In Garage"
              checked={bookingFormData.atticAccess === "In Garage"}
              onChange={handleInputChange}
              required
            /> In Garage
          </label>
          <label>
            <input
              type="radio"
              name="atticAccess"
              value="In Bedroom"
              checked={bookingFormData.atticAccess === "In Bedroom"}
              onChange={handleInputChange}
            /> In Bedroom
          </label>
          <label>
            <input
              type="radio"
              name="atticAccess"
              value="In Hallway"
              checked={bookingFormData.atticAccess === "In Hallway"}
              onChange={handleInputChange}
            /> In Hallway
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Type Of Mount</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="typeOfMount"
              value="Roof Mount"
              checked={bookingFormData.typeOfMount === "Roof Mount"}
              onChange={handleInputChange}
              required
            /> Roof Mount
          </label>
          <label>
            <input
              type="radio"
              name="typeOfMount"
              value="Ground Mount"
              checked={bookingFormData.typeOfMount === "Ground Mount"}
              onChange={handleInputChange}
            /> Ground Mount
          </label>
          <label>
            <input
              type="radio"
              name="typeOfMount"
              value="Both"
              checked={bookingFormData.typeOfMount === "Both"}
              onChange={handleInputChange}
            /> Both
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Meters On Site</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="metersOnSite"
              value="One"
              checked={bookingFormData.metersOnSite === "One"}
              onChange={handleInputChange}
              required
            /> One
          </label>
          <label>
            <input
              type="radio"
              name="metersOnSite"
              value="Two"
              checked={bookingFormData.metersOnSite === "Two"}
              onChange={handleInputChange}
            /> Two
          </label>
          <label>
            <input
              type="radio"
              name="metersOnSite"
              value="Three"
              checked={bookingFormData.metersOnSite === "Three"}
              onChange={handleInputChange}
            /> Three
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Electrical Panels On Site</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="electricalPanelsOnSite"
              value="One"
              checked={bookingFormData.electricalPanelsOnSite === "One"}
              onChange={handleInputChange}
              required
            /> One
          </label>
          <label>
            <input
              type="radio"
              name="electricalPanelsOnSite"
              value="Two"
              checked={bookingFormData.electricalPanelsOnSite === "Two"}
              onChange={handleInputChange}
            /> Two
          </label>
          <label>
            <input
              type="radio"
              name="electricalPanelsOnSite"
              value="Three"
              checked={bookingFormData.electricalPanelsOnSite === "Three"}
              onChange={handleInputChange}
            /> Three
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Animals</Label>
        <div className="flex gap-x-4">
          <label>
            <input
              type="radio"
              name="animals"
              value="Dogs"
              checked={bookingFormData.animals === "Dogs"}
              onChange={handleInputChange}
              required
            /> Dogs
          </label>
          <label>
            <input
              type="radio"
              name="animals"
              value="Cats"
              checked={bookingFormData.animals === "Cats"}
              onChange={handleInputChange}
            /> Cats
          </label>
          <label>
            <input
              type="radio"
              name="animals"
              value="None"
              checked={bookingFormData.animals === "None"}
              onChange={handleInputChange}
            /> None
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-y-1">
        <Label>Note to Installer (From Sales Rep)</Label>
        <textarea
          name="noteToInstallerFromSalesRep"
          value={bookingFormData.noteToInstallerFromSalesRep || ""}
          onChange={handleInputChange}
            className="border rounded-lg p-2"
          placeholder="Any additional details..."
          rows={4}
        />
      </div>

      <div className="flex gap-x-4">
      <SubmitButton text="Book Meeting" />
      </div>
    </form>
  );
};

export default BookingForm;
