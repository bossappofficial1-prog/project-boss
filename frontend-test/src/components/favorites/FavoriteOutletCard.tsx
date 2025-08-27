'use client'

import { useRouter } from 'next/navigation';
import { useFavorites, FavoriteOutlet } from '@/hooks/useFavorites';
import { useTranslations } from '@/hooks/useI18n';
import { ImageRender } from '@/components/shared/Image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MapPin, Store, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FavoriteOutletCardProps {
    outlet: FavoriteOutlet;
}

export default function FavoriteOutletCard({ outlet }: FavoriteOutletCardProps) {
    const { removeFavorite } = useFavorites();
    const t = useTranslations('outletDetail');
    const router = useRouter();

    const handleCardClick = () => {
        router.push(`/outlet/${outlet.id}`);
    };

    const handleRemoveFromFavorites = (e: React.MouseEvent) => {
        e.stopPropagation();
        removeFavorite(outlet.id);
    };

    const timeAgo = formatDistanceToNow(new Date(outlet.addedAt), { addSuffix: true });

    return (
        <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleCardClick}
        >
            <CardContent className="p-0">
                <div className="flex">
                    {/* Image */}
                    <div className="relative w-24 h-24 flex-shrink-0">
                        {outlet.image ? (
                            <ImageRender
                                src={outlet.image}
                                alt={outlet.name}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <Store className="w-8 h-8 text-primary/60" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate">
                                    {outlet.name}
                                </h3>

                                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <p className="text-xs truncate">{outlet.address}</p>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    {outlet.isOpen !== undefined && (
                                        <Badge
                                            variant={outlet.isOpen ? "default" : "secondary"}
                                            className={`text-xs ${outlet.isOpen
                                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                                    : "bg-gray-500 text-white"
                                                }`}
                                        >
                                            {outlet.isOpen ? t("open") : t("closed")}
                                        </Badge>
                                    )}

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>Added {timeAgo}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Remove button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveFromFavorites}
                                className="p-1 h-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Heart className="w-4 h-4 fill-current" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
