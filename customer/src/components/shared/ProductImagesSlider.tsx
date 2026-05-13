'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { resolveCustomerImageUrl } from '@/lib/url';
import { ArrowLeft, ArrowRight, Pause, Play, Image as ImageIcon, X } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from '@/lib/utils';

type SliderProps = {
    images: { url: string; alt?: string }[];
    autoPlay?: boolean;
    intervalMs?: number;
    showControls?: boolean;
    className?: string;
    aspectRatio?: string;
}

export function ProductImagesSlider({
    images,
    autoPlay = true,
    intervalMs = 5000,
    showControls = true,
    className = "",
    aspectRatio = "1/1"
}: SliderProps) {
    const [index, setIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, []);

    const startTimer = useCallback(() => {
        if (!isPlaying || images.length <= 1) return;
        clearTimer();
        timerRef.current = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, intervalMs);
    }, [isPlaying, images.length, intervalMs, clearTimer]);

    useEffect(() => {
        startTimer();
        return clearTimer;
    }, [startTimer, clearTimer]);

    const goto = useCallback((i: number) => {
        setIndex((i + images.length) % images.length);
    }, [images.length]);

    const handlePrevious = useCallback(() => goto(index - 1), [goto, index]);
    const handleNext = useCallback(() => goto(index + 1), [goto, index]);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);

    const [touchStart, setTouchStart] = useState<number | null>(null);
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
        clearTimer();
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const currentTouch = e.targetTouches[0].clientX;
        const diff = touchStart - currentTouch;
        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) handleNext();
            else handlePrevious();
            setTouchStart(null);
        }
    };
    const onTouchEnd = () => {
        setTouchStart(null);
        startTimer();
    };


    if (!images || images.length === 0) {
        return (
            <div
                className={cn("relative bg-slate-100 flex items-center justify-center rounded-lg", className)}
                style={{ aspectRatio }}
            >
                <div className="text-center text-slate-500">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <span className="text-sm">No images available</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className={cn("relative overflow-hidden group rounded-sm shadow-md", className)}
                onMouseEnter={clearTimer}
                onMouseLeave={startTimer}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="relative w-full bg-slate-200" style={{ aspectRatio }}>
                    {images.map((img, i) => (
                        <div
                            key={img.url + i}
                            onClick={() => setLightboxOpen(true)}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-500 ease-in-out cursor-pointer",
                                i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            )}
                            aria-hidden={i !== index}
                        >
                            <Image
                                src={resolveCustomerImageUrl(img.url)}
                                alt={img.alt || `Product image ${i + 1}`}
                                fill
                                priority={i === 0}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-20" />
                </div>

                {/* Kontrol Navigasi */}
                {images.length > 1 && showControls && (
                    <>
                        <button onClick={handlePrevious} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 text-slate-800 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:opacity-100 focus:outline-none z-30"><ArrowLeft size={20} /></button>
                        <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 text-slate-800 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white focus:opacity-100 focus:outline-none z-30"><ArrowRight size={20} /></button>

                        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-2 lg:hidden">
                            {images.map((_, i) => (
                                <button key={i} onClick={() => goto(i)} className={cn("w-2 h-2 rounded-full transition-all", i === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80')} />
                            ))}
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                            <span className="text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">{index + 1} / {images.length}</span>
                            {autoPlay && (
                                <button onClick={togglePlayPause} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm">
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {images.length > 1 && autoPlay && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 overflow-hidden z-30">
                        {isPlaying && (
                            <div
                                key={index}
                                className="h-full bg-white origin-left"
                                style={{ animation: `progress-deplete ${intervalMs}ms linear` }}
                            />
                        )}
                    </div>
                )}
            </div>

            {images.length > 1 && (
                <div className="hidden lg:flex gap-2 mt-3">
                    {images.map((img, i) => (
                        <button
                            key={"thumb-" + i}
                            onClick={() => goto(i)}
                            className={cn(
                                "w-20 h-20 rounded-md overflow-hidden relative border-2 transition-all",
                                i === index ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'
                            )}
                        >
                            <Image
                                src={resolveCustomerImageUrl(img.url)}
                                alt={img.alt || `Thumbnail ${i + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={images.map(img => ({ src: resolveCustomerImageUrl(img.url) }))}
                index={index}
                on={{ view: ({ index: currentIndex }) => setIndex(currentIndex) }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
            />
        </>
    );
}