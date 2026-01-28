import React from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "../ui/command";
import { sidebarData } from "@/config/sidebar";
import { useRouter } from "next/navigation";

export function CommadSearch() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <p className="text-muted-foreground text-sm">
                Pencet{" "}
                <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                    <span className="text-xs">⌘</span>k
                </kbd>
                {" "} untuk mencari workspace
            </p>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {sidebarData.sections.map((section, idx) => (
                        <React.Fragment key={section.label + idx}>
                            <CommandGroup heading={section.label}>
                                {section.items.map((item, j) => {
                                    const Icon = item.icon;

                                    if (item.items) {
                                        return item.items.map((subitem, k) => {
                                            const SubIcon = subitem.icon;

                                            return (
                                                <CommandItem
                                                    key={subitem.title + k}
                                                    onSelect={() => { router.push(item.url); setOpen((open) => !open) }}
                                                >
                                                    {SubIcon && <SubIcon />}
                                                    <span>{subitem.title}</span>
                                                </CommandItem>
                                            )
                                        })
                                    }

                                    return (
                                        <CommandItem
                                            onSelect={() => { router.push(item.url); setOpen((open) => !open) }}
                                            key={item.title + j}>
                                            {Icon && <Icon />}
                                            <span>{item.title}</span>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>

                            {sidebarData.sections[idx + 1] && <CommandSeparator />}
                        </React.Fragment>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    )
}