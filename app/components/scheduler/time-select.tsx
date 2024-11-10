import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourFormatted = hour.toString().padStart(2, '0');
      const minuteFormatted = minute.toString().padStart(2, '0');
      slots.push(`${hourFormatted}:${minuteFormatted}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeSelect({ value, onChange }: TimeSelectProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="time">Time</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="time" className="w-[280px]">
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {TIME_SLOTS.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}