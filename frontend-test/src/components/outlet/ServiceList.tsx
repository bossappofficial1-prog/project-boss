"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: string;
    category: string;
};

export default function ServiceList({ outletId }: { outletId: string }) {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Here you would fetch services for the outlet
        // For now using mock data
        setTimeout(() => {
            setServices([
                {
                    id: "1",
                    name: "Sample Service 1",
                    description: "This is a sample service description",
                    price: 200000,
                    duration: "1 hour",
                    category: "Category 1"
                },
                {
                    id: "2",
                    name: "Sample Service 2",
                    description: "This is another sample service description",
                    price: 300000,
                    duration: "2 hours",
                    category: "Category 2"
                }
            ]);
            setIsLoading(false);
        }, 1000);
    }, [outletId]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No services available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {services.map((service) => (
                <Card key={service.id}>
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                            <Badge variant="outline">{service.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold">
                                Rp {service.price.toLocaleString("id-ID")}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {service.duration}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
