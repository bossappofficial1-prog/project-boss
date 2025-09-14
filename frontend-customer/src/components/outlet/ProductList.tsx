"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
};

export default function ProductList({ outletId }: { outletId: string }) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Here you would fetch products for the outlet
        // For now using mock data
        setTimeout(() => {
            setProducts([
                {
                    id: "1",
                    name: "Sample Product 1",
                    description: "This is a sample product description",
                    price: 100000,
                    category: "Category 1"
                },
                {
                    id: "2",
                    name: "Sample Product 2",
                    description: "This is another sample product description",
                    price: 150000,
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

    if (products.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No products available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {products.map((product) => (
                <Card key={product.id}>
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">{product.description}</p>
                            </div>
                            <Badge variant="outline">{product.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <p className="font-semibold">
                            Rp {product.price.toLocaleString("id-ID")}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
