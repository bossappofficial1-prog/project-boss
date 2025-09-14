'use client'

import { useRouter } from 'next/navigation'
import { useFavorites, FavoriteOutlet } from '@/hooks/useFavorites'
import { useTranslations } from '@/hooks/useI18n'
import { ImageRender } from '@/components/shared/Image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, MapPin, Store, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FavoriteOutletCardProps {
    outlet: FavoriteOutlet
    isValidating?: boolean
    validationStatus?: 'valid' | 'invalid' | 'loading'
    onRemove?: (id: string) => void
    viewMode?: 'grid' | 'list'
}

export default function FavoriteOutletCard({
    outlet,
    isValidating = false,
    validationStatus,
    onRemove,
    viewMode = 'grid'
}: FavoriteOutletCardProps) {
    const { removeFavorite } = useFavorites()
    const tOutlet = useTranslations('outletDetail')
    const tFav = useTranslations('favorites')
    const router = useRouter()

    const isValid = validationStatus === 'valid'
    const isInvalid = validationStatus === 'invalid'
    const isLoading = validationStatus === 'loading' || isValidating

    const handleCardClick = () => {
        if (!isInvalid) router.push(`/outlet/${outlet.id}`)
    }
    const handleRemoveFromFavorites = (e: React.MouseEvent) => {
        e.stopPropagation()
        onRemove ? onRemove(outlet.id) : removeFavorite(outlet.id)
    }

    const timeAgo = formatDistanceToNow(new Date(outlet.addedAt), { addSuffix: true })

    return (
        <Card
            className={`group overflow-hidden transition-colors p-0 ${isInvalid ? 'opacity-60 border-destructive/40 bg-destructive/5 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/30'}`}
            onClick={handleCardClick}
        >
            {viewMode === 'list' ? (
                <CardContent className="p-0">
                    <div className="flex w-full h-24 relative">
                        {/* Image */}
                        <div className="relative w-28 h-full flex-shrink-0 overflow-hidden">
                            {outlet.image ? (
                                <ImageRender src={outlet.image} alt={outlet.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                    <Store className="w-7 h-7 text-primary/60" />
                                </div>
                            )}
                            {isLoading && !isInvalid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isInvalid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[1px]">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                            )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 h-full px-3 py-2 flex flex-col gap-1 min-w-0">
                            <div className="flex items-start gap-2">
                                <h3 className={`font-medium text-sm leading-snug line-clamp-2 flex-1 ${isInvalid ? 'text-muted-foreground' : 'text-foreground'}`}>{outlet.name}</h3>
                                <Button variant="ghost" size="sm" onClick={handleRemoveFromFavorites} className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                </Button>
                            </div>
                            <div className="flex items-start gap-1 text-[11px] text-muted-foreground min-w-0">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                <span className="truncate flex-1">{outlet.address}</span>
                            </div>
                            <div className="mt-auto flex items-center gap-2 justify-between pr-1">
                                <div className="flex items-center gap-1 flex-wrap">
                                    {validationStatus !== undefined && (
                                        <Badge variant={isValid ? 'default' : 'destructive'} className="text-[10px] px-1 py-0 h-5">
                                            {isValid ? tFav('validation.available') : tFav('validation.unavailable')}
                                        </Badge>
                                    )}
                                    {!isInvalid && outlet.isOpen !== undefined && (
                                        <Badge variant={outlet.isOpen ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 h-5">
                                            {outlet.isOpen ? tOutlet('open') : tOutlet('closed')}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span className="whitespace-nowrap">{timeAgo}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            ) : (
                <CardContent className="p-0">
                    <div className="relative">
                        <div className="relative h-32 overflow-hidden">
                            {outlet.image ? (
                                <ImageRender src={outlet.image} alt={outlet.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                    <Store className="w-8 h-8 text-primary/60" />
                                </div>
                            )}
                            {isLoading && !isInvalid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isInvalid && (
                                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[1px]">
                                    <AlertTriangle className="w-6 h-6 text-destructive" />
                                </div>
                            )}
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={`font-medium truncate ${isInvalid ? 'text-muted-foreground' : 'text-foreground'}`}>{outlet.name}</h3>
                                <Button variant="ghost" size="sm" onClick={handleRemoveFromFavorites} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Heart className="w-4 h-4 fill-current" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{outlet.address}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {validationStatus !== undefined && (
                                    <Badge variant={isValid ? 'default' : 'destructive'} className="text-xs">
                                        {isValid ? tFav('validation.available') : tFav('validation.unavailable')}
                                    </Badge>
                                )}
                                {!isInvalid && outlet.isOpen !== undefined && (
                                    <Badge variant={outlet.isOpen ? 'default' : 'secondary'} className="text-xs">
                                        {outlet.isOpen ? tOutlet('open') : tOutlet('closed')}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                                <div className="flex items-center gap-1">
                                    <Store className="w-3 h-3" />
                                    <span>{tFav('controls.restaurant')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{tFav('controls.addedAgo', { timeAgo })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
