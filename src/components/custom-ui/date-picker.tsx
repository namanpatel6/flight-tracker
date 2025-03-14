"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isAfter, isBefore } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className = "",
  minDate,
  maxDate,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset current month when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Generate days for the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return false;
  };

  // Day names for the header
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("relative w-full", className)} ref={datePickerRef}>
      {/* Date picker trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        <span className="flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </span>
        <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Date picker calendar */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 p-3 w-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day) => {
              const isSelected = value ? isSameDay(day, value) : false;
              const isDisabled = isDateDisabled(day);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(day);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 w-8 rounded-md text-center text-sm p-0 font-normal",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    !isSelected && isTodayDate && "bg-accent text-accent-foreground",
                    !isSelected && !isTodayDate && "hover:bg-accent hover:text-accent-foreground",
                    isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  onChange(today);
                  setIsOpen(false);
                }
              }}
              className="text-xs text-primary hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 