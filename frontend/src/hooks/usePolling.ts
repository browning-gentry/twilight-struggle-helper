import { useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
    interval: number;
    isPaused: boolean;
    callback: () => void;
}

export const usePolling = ({
    interval,
    isPaused,
    callback,
}: UsePollingOptions): { isPolling: boolean } => {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (isPaused) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPolling(false);
            return;
        }

        intervalRef.current = setInterval(callback, interval);
        setIsPolling(true);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPolling(false);
        };
    }, [interval, isPaused, callback]);

    return {
        isPolling,
    };
};
