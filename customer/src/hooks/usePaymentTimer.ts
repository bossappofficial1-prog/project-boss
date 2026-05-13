import { PaymentTimer } from '@/types';
import { useState, useEffect } from 'react';

export function usePaymentTimer(expiryTimeString: string, onExpire: () => void) {
    const [timeLeft, setTimeLeft] = useState<PaymentTimer>({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!expiryTimeString) return;

        const calculateTimeLeft = () => {
            const expiryTime = new Date(expiryTimeString.replace(' ', 'T'));
            const now = new Date();
            const difference = expiryTime.getTime() - now.getTime();

            if (difference > 0) {
                return {
                    hours: Math.floor(difference / (1000 * 60 * 60)),
                    minutes: Math.floor((difference / (1000 * 60)) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return { hours: 0, minutes: 0, seconds: 0 };
        };

        setTimeLeft(calculateTimeLeft());

        const intervalId = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                clearInterval(intervalId);
                onExpire();
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [expiryTimeString, onExpire]);

    return timeLeft;
}