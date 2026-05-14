"use client";

import * as React from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { MENU_GROUPS } from "../layout/sidebar/sidebar";
import { useRouter } from "next/navigation";
import { CogIcon, User } from "lucide-react";

export function CommandSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const sections = MENU_GROUPS;
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Ketik untuk mencari menu..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {[
              ...sections,
              ...[
                {
                  items: [
                    {
                      id: "owner-profile",
                      name: "Profile",
                      href: "/owner/profile",
                      icon: User,
                      badge: "",
                      shortcut: "CTRL+P",
                    },
                    {
                      id: "owner-settings",
                      name: "Settings",
                      href: "/owner/settings",
                      icon: CogIcon,
                      badge: "",
                      shortcut: "CTRL+S",
                    },
                  ],
                  label: "Akun",
                },
              ],
            ]

              .sort((a, b) => a.label.localeCompare(b.label))
              .map((section) => (
                <React.Fragment key={section.label}>
                  <CommandGroup heading={section.label}>
                    {section.items.map((item) => (
                      <CommandItem
                        onSelect={() => {
                          item.href ? router.push(item.href) : undefined;
                          setOpen(false);
                        }}
                        onClick={() =>
                          item.href ? router.push(item.href) : undefined
                        }
                        key={item.id}
                      >
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto text-xs font-medium text-gray-500">
                            {item.badge}
                          </span>
                        )}

                        {(item as any).shortcut && (
                          <CommandShortcut>
                            {(item as any).shortcut}
                          </CommandShortcut>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </React.Fragment>
              ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
