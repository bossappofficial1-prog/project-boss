"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Store, ExternalLink, MapPinned, Crown } from "lucide-react";
import Link from "next/link";
import { ImageRender } from "../shared/Image";
import { BusinessType, OutletType } from "@/types";
import { useTranslations } from "@/hooks/useI18n";
import { toMapDestination } from "@/lib/utils";

type OutletCardProps = {
    outlet: OutletType & Pick<BusinessType, "id" | "name"> & { _count: { orders: number }; distance: number };
    alignment?: "vertical" | "horizontal";
    from?: string;
};

const OutletImage = ({ outlet, imageSize }: { outlet: OutletCardProps['outlet'], imageSize: string }) => {
    const t = useTranslations("common")
    return (
        <div className="w-full h-full relative overflow-hidden bg-muted">
            {outlet.image ? (
                <ImageRender
                    src={outlet.image}
                    alt={outlet.name}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${!outlet.isOpen ? "grayscale brightness-90" : ""}`}
                    sizes={imageSize}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-12 h-12 text-muted-foreground/50" />
                </div>
            )}
            <div className="absolute top-2 right-2 flex gap-2">
                {outlet._count?.orders > 0 && (
                    <Badge variant="secondary" className="text-xs px-1 bg-orange-50 text-orange-600 border-orange-200 font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                    </Badge>
                )}
                <Badge variant={outlet.isOpen ? "default" : "secondary"} className={`h-5 px-2 text-xs font-medium border-none backdrop-blur-sm ${outlet.isOpen ? "bg-green-500/90 text-white shadow-sm" : "bg-gray-700/90 text-white"}`}>
                    {outlet.isOpen ? t("open") : t("closed")}
                </Badge>
            </div>
            {!outlet.isOpen && <div className="absolute inset-0 bg-black/20" />}
        </div>
    )
};

const OutletHeader = ({ name }: { name: string }) => (
    <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
            {name}
        </h3>
        <ExternalLink className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-0.5" />
    </div>
);

const OutletInfo = ({ outlet, showPhone }: { outlet: OutletCardProps['outlet'], showPhone: boolean }) => {
    const t = useTranslations("common");
    const formattedDistance = outlet.distance > 0.999 ? `${outlet.distance.toFixed(1)} ${t('km')}` : `${Math.round(outlet.distance * 1000)} ${t('m')}`;

    const handleInteraction = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toMapDestination(outlet.latitude, outlet.longitude)
    };

    return (
        <div className="space-y-1.5 mt-2 text-xs text-muted-foreground">
            {outlet.distance != null && (
                <div className="flex items-center gap-2">
                    <MapPinned className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="font-medium">{formattedDistance}</span>
                </div>
            )}
            {outlet.address && (
                <div onClick={(e) => handleInteraction(e)} className="flex items-start gap-2 hover:text-blue-600 transition-colors cursor-pointer group/address">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-blue-500 group-hover/address:text-blue-600" />
                    <span className="line-clamp-2 leading-snug">{outlet.address}</span>
                </div>
            )}
            {showPhone && outlet.phone && (
                <div onClick={(e) => handleInteraction(e)} className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-pointer group/phone">
                    <Phone className="w-3 h-3 shrink-0 text-green-500 group-hover/phone:text-green-600" />
                    <span className="font-medium">{outlet.phone}</span>
                </div>
            )}
        </div>
    );
};

export function OutletCard({ outlet, alignment = "vertical", from }: OutletCardProps) {

    if (alignment === "horizontal") {
        return (
            <Link href={{ pathname: `/outlet/${outlet.id}`, ...(from && from !== "" ? { query: { from: from } } : {}) }} className="block group">
                <div className="flex gap-3 bg-card rounded-lg border hover:shadow-md hover:border-border/60 transition-all duration-300 p-2.5">
                    <div className="w-24 h-24 rounded-md overflow-hidden shrink-0">
                        <OutletImage outlet={outlet} imageSize="80px" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <OutletHeader name={outlet.name} />
                        {/* {outlet.business && (
                            <Badge variant="outline" className="text-xs w-fit mt-1.5 h-5 bg-red-50 text-red-600 border-red-200 font-medium">
                                {outlet.business.name}
                            </Badge>
                        )} */}
                        <OutletInfo outlet={outlet} showPhone={false} />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={{ pathname: `/outlet/${outlet.id}`, ...(from && from !== "" ? { query: { from: from } } : {}) }} className="block h-full group">
            <Card className="flex flex-col gap-2 w-full h-full overflow-hidden border border-border/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-lg p-0">
                <div className="w-full h-40">
                    <OutletImage outlet={outlet} imageSize="(max-width: 768px) 100vw, 200px" />
                </div>
                <CardContent className="p-3 flex-grow flex flex-col justify-between">
                    <OutletHeader name={outlet.name} />
                    <OutletInfo outlet={outlet} showPhone={true} />
                </CardContent>
            </Card>
        </Link>
    );
}