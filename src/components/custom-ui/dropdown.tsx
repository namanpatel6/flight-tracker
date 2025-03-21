"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
  code?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: DropdownOption | null;
  onChange: (option: DropdownOption | null) => void;
  placeholder: string;
  isLoading?: boolean;
  className?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  loadingText?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  isLoading = false,
  className = "",
  searchPlaceholder = "Search...",
  noResultsText = "No results found",
  loadingText = "Loading..."
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    const searchLower = searchQuery.toLowerCase();
    const labelLower = option.label.toLowerCase();
    const codeLower = option.code?.toLowerCase() || '';
    
    return labelLower.includes(searchLower) || codeLower.includes(searchLower);
  });

  // Clear search query when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Ensure each option has a unique key by combining all properties and adding index
  const getOptionKey = (option: DropdownOption, index: number): string => {
    return `${option.value}_${option.code || ''}_${index}`;
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {value ? (
          <span className="flex items-center">
            {value.label}
            {value.code && <span className="ml-1 text-muted-foreground">({value.code})</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-input bg-popover text-popover-foreground shadow-md">
          {/* Search input */}
          <div className="flex items-center border-b border-input p-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full hover:bg-accent p-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto p-1">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {loadingText}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {noResultsText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={getOptionKey(option, index)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value?.value === option.value && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  <span className="flex-1">{option.label}</span>
                  {option.code && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {option.code}
                    </span>
                  )}
                  {value?.value === option.value && (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 