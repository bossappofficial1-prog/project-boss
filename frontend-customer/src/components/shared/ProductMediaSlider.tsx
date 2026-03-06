'use client'

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { resolveCustomerImageUrl } from '@/lib/url';
import { ArrowLeft, ArrowRight, Pause, Play, Image as ImageIcon, X, Film } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from '@/lib/utils';
import { ProductMediaItem } from '@/types/product';

type MediaSliderProps = {
    media: ProductMediaItem[];
    autoPlay?: boolean;
    intervalMs?: number;
    showControls?: boolean;
    className?: string;
    aspectRatio?: string;
}

export function ProductMediaSlider({
    media,
    autoPlay = true,
    intervalMs = 5000,
    showControls = true,
    className = "",
    aspectRatio = "16/9"
}: MediaSliderProps) {
    const [index, setIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

    const currentItem = media[index];
    const isCurrentVideo = currentItem?.type === 'VIDEO';

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }, []);

    const startTimer = useCallback(() => {
        if (!isPlaying || media.length <= 1 || isCurrentVideo) return;
        clearTimer();
        timerRef.current = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % media.length);
        }, intervalMs);
    }, [isPlaying, media.length, intervalMs, clearTimer, isCurrentVideo]);

    useEffect(() => {
        startTimer();
        return clearTimer;
    }, [startTimer, clearTimer]);

    // Fungsi stabil untuk mendaftarkan referensi video (tidak berubah tiap render)
    const registerVideo = useCallback((i: number, el: HTMLVideoElement | null) => {
        if (el) {
            videoRefs.current.set(i, el);
        } else {
            videoRefs.current.delete(i);
        }
    }, []);

    // Pause/play videos saat slide berubah
    useEffect(() => {
        videoRefs.current.forEach((video, i) => {
            if (i === index) {
                video.play().catch(() => { });
            } else {
                video.pause();
                // Hanya reset currentTime jika video sudah dimainkan sedikit
                // Ini mencegah resetting yang memaksa browser fetch ulang jika buffer dibuang
                if (video.currentTime > 0) {
                    video.currentTime = 0;
                }
            }
        });
    }, [index]);

    const goto = useCallback((i: number) => {
        setIndex((i + media.length) % media.length);
    }, [media.length]);

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

    if (!media || media.length === 0) {
        return (
            <div
                className={cn("relative bg-slate-100 flex items-center justify-center rounded-lg", className)}
                style={{ aspectRatio }}
            >
                <div className="text-center text-slate-500">
                    <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Belum ada media</span>
                </div>
            </div>
        );
    }

    const lightboxSlides = media
        .filter(m => m.type === 'IMAGE')
        .map(m => ({ src: resolveCustomerImageUrl(m.url) }));

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
                <div className="relative w-full bg-black/95" style={{ aspectRatio }}>
                    {media.map((item, i) => {
                        const isActive = i === index;

                        if (item.type === 'VIDEO' && item.source === 'EMBED') {
                            return <MemoizedEmbed key={item.url + i} item={item} isActive={isActive} index={i} />;
                        }

                        if (item.type === 'VIDEO' && item.source === 'UPLOAD') {
                            return (
                                <MemoizedVideo
                                    key={item.url + i}
                                    item={item}
                                    isActive={isActive}
                                    index={i}
                                    registerVideo={registerVideo}
                                />
                            );
                        }

                        return (
                            <MemoizedImage
                                key={item.url + i}
                                item={item}
                                isActive={isActive}
                                index={i}
                                onClick={() => setLightboxOpen(true)}
                            />
                        );
                    })}
                </div>

                {/* Navigation Controls */}
                {media.length > 1 && showControls && (
                    <>
                        <button onClick={handlePrevious} className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/40 text-white backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 focus:opacity-100 focus:outline-none z-30"><ArrowLeft size={18} /></button>
                        <button onClick={handleNext} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/40 text-white backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 focus:opacity-100 focus:outline-none z-30"><ArrowRight size={18} /></button>

                        {/* Dots indicator */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5 z-30">
                            {media.map((_, i) => (
                                <button key={i} onClick={() => goto(i)} className={cn("rounded-full transition-all", i === index ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80')} />
                            ))}
                        </div>

                        {/* Counter + play/pause */}
                        <div className="absolute top-2 md:top-3 right-2 md:right-3 flex items-center gap-1.5 z-30">
                            <span className="text-[10px] md:text-xs font-medium text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex items-center">
                                {currentItem?.type === 'VIDEO' && <Film className="inline w-3 h-3 mr-1" />}
                                {index + 1}/{media.length}
                            </span>
                            {autoPlay && !isCurrentVideo && (
                                <button onClick={togglePlayPause} className="p-1.5 md:p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/60">
                                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Progress bar (images only) */}
                {media.length > 1 && autoPlay && !isCurrentVideo && (
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

            {/* Thumbnail strip */}
            {media.length > 1 && (
                <div className="flex gap-1.5 md:gap-2 mt-2 md:mt-3 overflow-x-auto scrollbar-hide">
                    {media.map((item, i) => (
                        <button
                            key={"thumb-" + i}
                            onClick={() => goto(i)}
                            className={cn(
                                "w-14 h-8 md:w-20 md:h-12 rounded overflow-hidden relative border-2 transition-all flex-shrink-0",
                                i === index ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-transparent opacity-60 hover:opacity-100'
                            )}
                        >
                            {item.type === 'VIDEO' ? (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                                    {item.thumbnailUrl ? (
                                        <img
                                            src={resolveCustomerImageUrl(item.thumbnailUrl)}
                                            alt={item.alt || `Thumbnail ${i + 1}`}
                                            className="object-cover w-full h-full opacity-50"
                                        />
                                    ) : null}
                                    <Film className="absolute w-4 h-4 text-white drop-shadow z-10" />
                                </div>
                            ) : (
                                <img
                                    src={resolveCustomerImageUrl(item.url)}
                                    alt={item.alt || `Thumbnail ${i + 1}`}
                                    className="object-cover w-full h-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox for images only */}
            {lightboxSlides.length > 0 && (
                <Lightbox
                    open={lightboxOpen}
                    close={() => setLightboxOpen(false)}
                    slides={lightboxSlides}
                    index={Math.min(index, lightboxSlides.length - 1)}
                    on={{ view: ({ index: currentIndex }: any) => setIndex(currentIndex) }}
                    styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes progress-deplete {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </>
    );
}


const MemoizedVideo = memo(({ item, isActive, index, registerVideo }: { item: ProductMediaItem, isActive: boolean, index: number, registerVideo: (i: number, el: HTMLVideoElement | null) => void }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out bg-black",
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            )}
            aria-hidden={!isActive}
        >
            <video
                ref={(el) => registerVideo(index, el)}
                preload="auto"
                playsInline
                className="w-full h-full object-contain"
                controls
                poster={item.thumbnailUrl ?? undefined}
            >
                <source src={item.url} />
            </video>
        </div>
    );
});
MemoizedVideo.displayName = 'MemoizedVideo';

const MemoizedEmbed = memo(({ item, isActive, index }: { item: ProductMediaItem, isActive: boolean, index: number }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out",
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            )}
            aria-hidden={!isActive}
        >
            {isActive && (
                <iframe
                    src={item.url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={item.alt || `Video ${index + 1}`}
                />
            )}
        </div>
    );
});
MemoizedEmbed.displayName = 'MemoizedEmbed';

const MemoizedImage = memo(({ item, isActive, index, onClick }: { item: ProductMediaItem, isActive: boolean, index: number, onClick: () => void }) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-in-out cursor-pointer",
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            )}
            aria-hidden={!isActive}
        >
            <Image
                src={resolveCustomerImageUrl(item.url)}
                alt={item.alt || `Product image ${index + 1}`}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain w-full h-full"
            />
        </div>
    );
});
MemoizedImage.displayName = 'MemoizedImage';