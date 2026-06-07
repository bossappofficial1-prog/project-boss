'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface PayoutVsRequestChartProps {
    data: any[]
}

export function PayoutVsRequestChart({ data }: PayoutVsRequestChartProps) {
    return (
        <Card className="col-span-4 shadow-md rounded-md border-border/50">
            <CardHeader>
                <CardTitle>Pembayaran vs Permintaan</CardTitle>
                <CardDescription>Perbandingan permintaan penarikan vs pembayaran diproses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)/0.4' }}
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                            />
                            <Bar dataKey="requests" name="Permintaan" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="payouts" name="Dibayar" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}