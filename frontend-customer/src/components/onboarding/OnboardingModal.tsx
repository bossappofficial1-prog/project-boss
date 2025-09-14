'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Store, MapPin, ShoppingCart, CheckCircle, Rocket, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { motion } from 'framer-motion'


export type OnboardingModalProps = {
    open: boolean;
    onComplete: () => void;
    onClose: () => void;
};


export default function OnboardingModal({ open, onComplete, onClose }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [geoGranted, setGeoGranted] = useState<boolean | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const trl = useTranslations('onboarding')
    const isMobile = useMediaQuery('(max-width: 640px)')
    const dialogRef = useRef<HTMLDivElement>(null)

    const steps = [
        {
            title: trl("step1.title"),
            description: trl("step1.description"),
            icon: Store,
            iconColor: 'text-blue-600'
        },
        {
            title: trl("step2.title"),
            description: trl("step2.description"),
            icon: MapPin,
            geoStep: true,
            iconColor: 'text-green-600'
        },
        {
            title: trl("step3.title"),
            description: trl("step3.description"),
            icon: ShoppingCart,
            iconColor: 'text-red-600'
        },
    ]

    // Animation to create a subtle fade effect when switching between steps
    const [fadeDirection, setFadeDirection] = useState<'left' | 'right' | null>(null)
    useEffect(() => {
        if (!open) {
            // Reset state when closed
            setTimeout(() => {
                setCurrentStep(0)
                setGeoGranted(null)
            }, 300); // Delay to allow for closing animation
        }
    }, [open])

    const step = steps[currentStep]
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    // Minimal swipe distance in pixels
    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance
        const isRightSwipe = distance < -minSwipeDistance

        if (isLeftSwipe && currentStep < steps.length - 1) {
            handleNext()
        } else if (isRightSwipe && currentStep > 0) {
            handleBack()
        }
    }

    const handleNext = () => {
        if (currentStep === steps.length - 1) {
            onComplete()
        } else {
            setFadeDirection('left')
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentStep(prev => prev + 1)
                setIsAnimating(false)
                setTimeout(() => setFadeDirection(null), 50)
            }, 200)
        }
    }

    const handleBack = () => {
        if (currentStep === 0) {
            onClose()
        } else {
            setFadeDirection('right')
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentStep(prev => prev - 1)
                setIsAnimating(false)
                setTimeout(() => setFadeDirection(null), 50)
            }, 200)
        }
    }

    const requestGeo = () => {
        if (!navigator.geolocation) {
            setGeoGranted(false)
            return
        }
        navigator.geolocation.getCurrentPosition(
            () => setGeoGranted(true),
            () => setGeoGranted(false),
            { maximumAge: 60000, timeout: 10000 }
        )
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                ref={dialogRef}
                onInteractOutside={(e) => e.preventDefault()}
                className={cn(
                    "w-full sm:max-w-md bg-white z-[99999] rounded-2xl shadow-xl overflow-hidden p-0 border-0",
                    isMobile && "h-auto max-h-[85vh] max-w-full rounded-t-2xl rounded-b-none fixed bottom-0 top-auto translate-y-0"
                )}
                onPointerDownOutside={(e) => {
                    if (isMobile) e.preventDefault();
                }}
                style={{
                    width: isMobile ? '100%' : undefined,
                    marginTop: isMobile ? 'auto' : undefined,
                    marginBottom: isMobile ? '0' : undefined,
                }}>
                {/* Background */}
                <div className="absolute inset-0 bg-white" />

                {/* Swipe indicator for mobile */}
                {isMobile && (
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                )}

                {/* Header with progress dots */}
                <DialogHeader className="relative z-10 px-6 pt-4 pb-2">
                    <div className={cn("flex justify-center items-center", isMobile ? "mb-2" : "mb-4")}>
                        <div className="flex gap-1.5">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    onClick={() => index < currentStep && setCurrentStep(index)}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                                        index === currentStep
                                            ? 'bg-red-600 w-8'
                                            : index < currentStep
                                                ? 'bg-red-300 w-2 hover:bg-red-400'
                                                : 'bg-gray-200 w-2'
                                    )}
                                />
                            ))}
                        </div>
                        {!isMobile && (
                            <span className="text-xs text-gray-500 font-medium ml-4">
                                {currentStep + 1} / {steps.length}
                            </span>
                        )}
                    </div>
                    {isMobile && (
                        <div className="absolute top-4 left-6 text-xs text-gray-500 font-medium">
                            {currentStep + 1} / {steps.length}
                        </div>
                    )}
                </DialogHeader>

                {/* Main Content */}
                <div className={cn(
                    "relative z-10 px-8 pb-6 min-h-[300px]",
                    isMobile && "px-6 pt-4 min-h-[auto] flex flex-col"
                )}
                    onTouchStart={isMobile ? onTouchStart : undefined}
                    onTouchMove={isMobile ? onTouchMove : undefined}
                    onTouchEnd={isMobile ? onTouchEnd : undefined}>
                    <div className={cn(
                        "transform transition-all duration-300",
                        isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
                        fadeDirection === 'left' && 'translate-x-4',
                        fadeDirection === 'right' && '-translate-x-4',
                        isMobile ? 'flex-1 flex flex-col' : ''
                    )}>
                        <div className={cn("text-center mb-6", isMobile && "mb-4")}>
                            <div className={cn(
                                "inline-flex p-4 mb-5 bg-white rounded-full shadow-sm",
                                isMobile && "p-3.5 mb-4"
                            )}>
                                <div className={cn(
                                    "w-14 h-14 flex items-center justify-center rounded-full",
                                    isMobile ? "w-12 h-12" : "",
                                    step.iconColor === 'text-blue-600' && "bg-blue-50",
                                    step.iconColor === 'text-green-600' && "bg-green-50",
                                    step.iconColor === 'text-red-600' && "bg-red-50"
                                )}>
                                    <step.icon size={isMobile ? 28 : 32} className={step.iconColor || "text-red-600"} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                        <DialogTitle className={cn(
                            "text-2xl font-bold text-gray-900 mb-2 text-center leading-tight",
                            isMobile && "text-xl mb-2"
                        )}>
                            {step.title}
                        </DialogTitle>

                        <DialogDescription className={cn(
                            "text-base text-gray-500 text-center leading-relaxed mb-6 max-w-[90%] mx-auto",
                            isMobile && "text-sm mb-5"
                        )}>
                            {step.description}
                        </DialogDescription>

                        {step.geoStep && (
                            <div className={cn("space-y-3 mx-auto max-w-[85%]", isMobile ? "mt-auto" : "")}>
                                <div className="space-y-2.5">
                                    <Button
                                        onClick={requestGeo}
                                        className={cn(
                                            "w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm",
                                            isMobile && "py-2.5 text-sm"
                                        )}
                                    >
                                        <MapPin size={isMobile ? 16 : 18} strokeWidth={2.5} />
                                        {trl("step2.allowLocation")}
                                    </Button>
                                    <Button
                                        onClick={() => setGeoGranted(false)}
                                        variant="outline"
                                        className={cn(
                                            "w-full py-3 bg-white hover:bg-gray-50 text-gray-600 border-gray-200 font-medium rounded-lg transition-all duration-200",
                                            isMobile && "py-2.5 text-sm"
                                        )}
                                    >
                                        {trl("step2.skip")}
                                    </Button>
                                </div>

                                {geoGranted === true && (
                                    <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-2.5 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5">
                                        <CheckCircle size={14} className="text-green-500" />
                                        <span>Location enabled successfully!</span>
                                    </div>
                                )}
                                {geoGranted === false && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5">
                                        <X size={14} className="text-red-500" />
                                        <span>Location access denied</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className={cn(
                    "relative z-10 p-6 pt-4 border-t border-gray-100 sm:justify-between",
                    isMobile && "px-6 pb-3 pt-4 sticky bottom-0 bg-white mt-auto flex flex-row"
                )}>
                    {currentStep > 0 ? (
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            className={cn(
                                "px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-1.5",
                                isMobile && "px-3 py-2 text-sm flex-1"
                            )}
                        >
                            <ArrowLeft size={isMobile ? 14 : 16} strokeWidth={2.5} />
                            <span className={isMobile ? "" : "font-medium"}>{trl("actions.back")}</span>
                        </Button>
                    ) : (
                        <div className={isMobile ? "flex-1" : "w-[100px]"} />
                    )}

                    <Button
                        onClick={handleNext}
                        className={cn(
                            "px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm",
                            isMobile && "px-4 py-2 text-sm flex-1",
                            currentStep === steps.length - 1 && "bg-green-600 hover:bg-green-700"
                        )}
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                <span className="font-medium">{trl("actions.getStarted")}</span>
                                <Rocket size={isMobile ? 14 : 16} strokeWidth={2.5} />
                            </>
                        ) : (
                            <>
                                <span className="font-medium">{trl("actions.next")}</span>
                                <ArrowRight size={isMobile ? 14 : 16} strokeWidth={2.5} />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}