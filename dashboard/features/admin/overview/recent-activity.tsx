'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Server } from "lucide-react";

interface RecentActivityProps {
    data: any[]
}

export function RecentActivity({ data }: RecentActivityProps) {
    return (
        <Card className="col-span-3 shadow-md rounded-md border-border/50 flex flex-col">
            <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
                <CardDescription>Event sistem dan aksi user terkini.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[300px] px-6">
                    <div className="space-y-6">
                        {data.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 group">
                                {item.avatar ? (
                                    <Avatar className="h-9 w-9 border border-border">
                                        <AvatarFallback>{item.user.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
                                        <Server className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                        {item.user}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.action}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">{item.time}</span>
                                        {item.status === 'critical' && <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded-[4px]">Kritis</Badge>}
                                        {item.status === 'warning' && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-[4px] text-amber-600 bg-amber-100 dark:bg-amber-900/30">Review</Badge>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t border-border/50 p-3">
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs">Lihat semua aktivitas</Button>
            </CardFooter>
        </Card>
    )
}