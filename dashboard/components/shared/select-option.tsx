"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";

type BaseOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectOptionProps<T extends BaseOption = BaseOption> = {
  options: readonly T[];
  value: T["value"];
  onValueChange: (value: T["value"]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
};

export function SelectOption<T extends BaseOption = BaseOption>({
  options,
  value,
  onValueChange,
  placeholder = "Pilih opsi...",
  label,
  className,
  disabled = false,
  name,
  id,
}: SelectOptionProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-sm h-11",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          {label && (
            <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              {label}
            </div>
          )}
          <CommandInput
            placeholder={`Cari ${label?.toLowerCase() ?? "opsi"}...`}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onValueChange(opt.value as T["value"]);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {"description" in opt && opt.description && (
                      <span className="text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
    </Popover>
  );
}
