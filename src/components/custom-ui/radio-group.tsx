"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function RadioGroup({
  options,
  value,
  onChange,
  className = "",
  orientation = "horizontal"
}: RadioGroupProps) {
  return (
    <div 
      className={cn(
        "flex gap-2",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        className
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex items-center cursor-pointer",
            orientation === "vertical" && "w-full"
          )}
        >
          <div className="flex items-center">
            <div
              className={cn(
                "w-4 h-4 rounded-full border mr-2 flex items-center justify-center",
                value === option.value
                  ? "border-primary"
                  : "border-input"
              )}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-sm">{option.label}</span>
          </div>
          <input
            type="radio"
            className="sr-only"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        </label>
      ))}
    </div>
  );
} 