"use client"

import { Bell, Search, Settings } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CommadSearch } from "@/components/shared/command-searc"
import ThemeToggle from "@/components/theme-toggle"

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1 hover:bg-muted/50 data-[state=open]:bg-accent" />

                <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />

                <div className="relative hidden md:flex items-center">
                    <CommadSearch />
                </div>
            </div>

            {/* --- RIGHT SECTION: Actions --- */}
            <div className="flex items-center gap-2">
                {/* Mobile Search Trigger (Visible only on small screens) */}
                <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                    <Search className="h-5 w-5" />
                </Button>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                                <Bell className="h-5 w-5" />
                                {/* Notification Dot with Ring for better contrast */}
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                                <span className="sr-only">Notifications</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Notifications</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/50 text-muted-foreground hover:text-foreground">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                </Button>

                <ThemeToggle />
            </div>
        </header>
    )
}