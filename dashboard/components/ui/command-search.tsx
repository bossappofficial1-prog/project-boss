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
import { useRouter } from "next/navigation";
import { CogIcon, Rocket, User } from "lucide-react";
import { MENU_GROUPS, MenuGroup } from "../owner/layout/sidebar/sidebar";
import { OutletType } from "@/types";
import { useOutletContext } from "../providers/OutletProvider";

export function CommandSearch({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const sections = MENU_GROUPS;
  const router = useRouter();
  const { selectedOutlet: outlet } = useOutletContext();

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
                  showOn: [OutletType.CUSTOM, OutletType.EVENT, OutletType.FNB, OutletType.RETAIL, OutletType.SERVICE]
                },
              ] as MenuGroup[],
            ]
              .filter((section) => {
                return !section.showOn || section.showOn.includes(outlet?.type!)
              })
              .sort((a, b) => a.label.localeCompare(b.label))
              .map((section) => (
                <React.Fragment key={section.label}>
                  <CommandGroup heading={section.label}>
                    {section.items.map((item) => (
                      <CommandItem
                        disabled={item.disabled}
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

                        <RenderCommandShortCut item={item} />
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

function CommandShortCut({ item }: { item: MenuGroup['items'][0] }) {
  if (item.disabled)
    return (
      <CommandShortcut>
        <Rocket />
      </CommandShortcut>
    )
  else if (item.shortcut)
    return (
      <CommandShortcut>
        {item.shortcut}
      </CommandShortcut>
    )

  return null
}

const RenderCommandShortCut = React.memo(CommandShortCut)
