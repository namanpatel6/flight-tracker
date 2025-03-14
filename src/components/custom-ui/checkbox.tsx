"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
  disabled = false
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center space-x-2 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded border flex items-center justify-center",
          checked
            ? "bg-primary border-primary"
            : "border-input",
          disabled && "bg-muted border-muted-foreground"
        )}
        onClick={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={() => {
          if (!disabled) {
            onChange(!checked);
          }
        }}
        disabled={disabled}
      />
    </label>
  );
} 