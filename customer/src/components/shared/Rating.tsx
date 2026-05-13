"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    className?: string;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export function Rating({
    rating,
    maxRating = 5,
    size = 'md',
    showValue = true,
    className = '',
    interactive = false,
    onRatingChange
}: RatingProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    const handleStarClick = (starIndex: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(starIndex + 1);
        }
    };

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <div className="flex items-center">
                {Array.from({ length: maxRating }, (_, index) => {
                    const isFilled = index < Math.floor(rating);
                    const isHalfFilled = index < rating && index >= Math.floor(rating);

                    return (
                        <button
                            key={index}
                            type="button"
                            className={cn(
                                'relative',
                                interactive && 'cursor-pointer hover:scale-110 transition-transform'
                            )}
                            onClick={() => handleStarClick(index)}
                            disabled={!interactive}
                        >
                            <Star
                                className={cn(
                                    sizeClasses[size],
                                    'transition-colors',
                                    isFilled
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                )}
                            />
                            {isHalfFilled && (
                                <Star
                                    className={cn(
                                        sizeClasses[size],
                                        'absolute top-0 left-0 text-yellow-400 fill-yellow-400',
                                        'overflow-hidden'
                                    )}
                                    style={{
                                        clipPath: `inset(0 ${100 - (rating % 1) * 100}% 0 0)`
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {showValue && (
                <span className={cn(
                    'font-medium text-gray-700 dark:text-gray-300',
                    textSizeClasses[size]
                )}>
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}

interface RatingStatsProps {
    rating: number;
    totalReviews: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function RatingStats({
    rating,
    totalReviews,
    size = 'md',
    className = ''
}: RatingStatsProps) {
    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Rating rating={rating} size={size} showValue={false} />
            <span className={cn('font-medium', textSizeClasses[size])}>
                {rating.toFixed(1)}
            </span>
            <span className={cn('text-muted-foreground', textSizeClasses[size])}>
                ({totalReviews.toLocaleString()})
            </span>
        </div>
    );
}
