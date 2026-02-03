"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: string) => void;
  availableHours?: { start: string; end: string };
  bookedSlots?: string[]; // Format: "YYYY-MM-DD HH:MM"
  minDate?: Date;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00",
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  availableHours = { start: "08:00", end: "18:00" },
  bookedSlots = [],
  minDate = new Date(),
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Filter available time slots
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const dateStr = selectedDate.toISOString().split("T")[0];
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    return timeSlots.filter((slot) => {
      // Check if within available hours
      if (slot < availableHours.start || slot > availableHours.end) {
        return false;
      }

      // Check if slot is in the past (for today)
      if (isToday) {
        const [hours, minutes] = slot.split(":").map(Number);
        const slotTime = new Date(today);
        slotTime.setHours(hours, minutes, 0, 0);
        if (slotTime <= today) {
          return false;
        }
      }

      // Check if slot is booked
      const slotKey = `${dateStr} ${slot}`;
      if (bookedSlots.includes(slotKey)) {
        return false;
      }

      return true;
    });
  }, [selectedDate, availableHours, bookedSlots]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date < minDate;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="border rounded-lg p-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            disabled={
              currentMonth <= new Date(minDate.getFullYear(), minDate.getMonth(), 1)
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-medium">
            {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="p-2" />;
            }

            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);

            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => onDateChange(date)}
                className={cn(
                  "p-2 text-sm rounded-lg transition-colors",
                  disabled && "text-muted-foreground/50 cursor-not-allowed",
                  !disabled && !selected && "hover:bg-muted",
                  selected && "bg-primary text-primary-foreground"
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">Available Times</h3>
          {availableTimeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No available time slots for this date
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {availableTimeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onTimeChange(slot)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-colors",
                    selectedTime === slot
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
