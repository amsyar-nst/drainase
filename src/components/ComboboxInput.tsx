"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxInputProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export const ComboboxInput: React.FC<ComboboxInputProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Pilih...",
  emptyMessage = "Tidak ditemukan.",
  className,
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    onValueChange(newValue);
    setInputValue(newValue);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue); // Update parent state immediately with typed value
  };

  const filteredOptions: ComboboxOption[] = options.map(opt => ({ value: opt.toLowerCase(), label: opt }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {inputValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={(search) => {
              setInputValue(search);
              onValueChange(search); // Update parent state with search value
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions
                .filter((option) =>
                  option.label.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for CommandItem value for display
                    onSelect={() => handleSelect(option.label)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.toLowerCase() === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};