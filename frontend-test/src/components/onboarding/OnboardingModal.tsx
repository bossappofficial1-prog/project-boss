'use client'

import React, { useEffect, useState } from 'react'
import { Store, MapPin, ShoppingCart, CheckCircle, Rocket, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/useI18n'


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

    const steps = [
        {
            title: trl("step1.title"),
            description: trl("step1.description"),
            icon: Store,
            gradient: 'from-blue-500 to-purple-600'
        },
        {
            title: trl("step2.title"),
            description: trl("step2.description"),
            icon: MapPin,
            geoStep: true,
            gradient: 'from-green-500 to-teal-600'
        },
        {
            title: trl("step3.title"),
            description: trl("step3.description"),
            icon: ShoppingCart,
            gradient: 'from-orange-500 to-red-600'
        },
    ]
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

    const handleNext = () => {
        if (currentStep === steps.length - 1) {
            onComplete()
        } else {
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentStep(prev => prev + 1)
                setIsAnimating(false)
            }, 200)
        }
    }

    const handleBack = () => {
        if (currentStep === 0) {
            onClose()
        } else {
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentStep(prev => prev - 1)
                setIsAnimating(false)
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
                onInteractOutside={(e) => e.preventDefault()}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-0 border-0">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-5 transition-all duration-500`} />

                {/* Header with progress dots */}
                <DialogHeader className="relative z-10 p-6 pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'bg-red-700 w-8'
                                        : index < currentStep
                                            ? 'bg-red-400'
                                            : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            {currentStep + 1} of {steps.length}
                        </span>
                    </div>
                </DialogHeader>

                {/* Main Content */}
                <div className="relative z-10 px-8 pb-8 min-h-[350px]">
                    <div className={`transform transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
                        <div className="text-center mb-8">
                            <div className="mb-6 inline-flex p-6 bg-white rounded-full shadow-lg animate-bounce">
                                <step.icon size={64} className="text-red-700" />
                            </div>
                        </div>

                        <DialogTitle className="text-3xl font-bold text-gray-900 mb-4 text-center leading-tight">
                            {step.title}
                        </DialogTitle>

                        <DialogDescription className="text-lg text-gray-600 text-center leading-relaxed mb-8">
                            {step.description}
                        </DialogDescription>

                        {step.geoStep && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <Button
                                        onClick={requestGeo}
                                        className="w-full py-6 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <MapPin />
                                        {trl("step2.allowLocation")}
                                    </Button>
                                    <Button
                                        onClick={() => setGeoGranted(false)}
                                        variant="ghost"
                                        className="w-full py-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
                                    >
                                        {trl("step2.skip")}
                                    </Button>
                                </div>

                                {geoGranted === true && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium text-center animate-pulse flex items-center justify-center gap-2">
                                        <CheckCircle size={16} />
                                        Location enabled successfully!
                                    </div>
                                )}
                                {geoGranted === false && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
                                        <X size={16} />
                                        Location access denied
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="relative z-10 p-6 pt-0 sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all duration-200 flex items-center gap-2"
                    >
                        {currentStep === 0 ? (
                            <>
                                <X size={16} />
                                {trl("actions.close")}
                            </>
                        ) : (
                            <>
                                <ArrowLeft size={16} />
                                {trl("actions.back")}
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleNext}
                        className="px-8 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                <Rocket size={16} />
                                {trl("actions.getStarted")}
                            </>
                        ) : (
                            <>
                                {trl("actions.next")}
                                <ArrowRight size={16} />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}