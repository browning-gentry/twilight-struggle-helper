import { renderHook } from '@testing-library/react';
import { usePolling } from '../usePolling';

describe('usePolling', () => {
    const mockCallback = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns isPolling as false when paused', () => {
        const { result } = renderHook(() =>
            usePolling({
                interval: 1000,
                isPaused: true,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(false);
    });

    it('returns isPolling as true when not paused', () => {
        const { result } = renderHook(() =>
            usePolling({
                interval: 1000,
                isPaused: false,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(true);
    });

    it('updates isPolling when pause state changes', () => {
        const { result, rerender } = renderHook(
            ({ isPaused }) =>
                usePolling({
                    interval: 1000,
                    isPaused,
                    callback: mockCallback,
                }),
            { initialProps: { isPaused: false } },
        );
        expect(result.current.isPolling).toBe(true);
        rerender({ isPaused: true });
        expect(result.current.isPolling).toBe(false);
        rerender({ isPaused: false });
        expect(result.current.isPolling).toBe(true);
    });

    it('handles different interval values', () => {
        const { result, rerender } = renderHook(
            ({ interval }) =>
                usePolling({
                    interval,
                    isPaused: false,
                    callback: mockCallback,
                }),
            { initialProps: { interval: 1000 } },
        );
        expect(result.current.isPolling).toBe(true);
        rerender({ interval: 2000 });
        expect(result.current.isPolling).toBe(true);
        rerender({ interval: 0 });
        expect(result.current.isPolling).toBe(true);
    });

    it('handles callback changes', () => {
        const mockCallback1 = jest.fn();
        const mockCallback2 = jest.fn();
        const { result, rerender } = renderHook(
            ({ callback }) =>
                usePolling({
                    interval: 1000,
                    isPaused: false,
                    callback,
                }),
            { initialProps: { callback: mockCallback1 } },
        );
        expect(result.current.isPolling).toBe(true);
        rerender({ callback: mockCallback2 });
        expect(result.current.isPolling).toBe(true);
    });

    it('maintains polling state across re-renders with same props', () => {
        const { result, rerender } = renderHook(() =>
            usePolling({
                interval: 1000,
                isPaused: false,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(true);
        rerender();
        expect(result.current.isPolling).toBe(true);
    });

    it('handles edge case with zero interval', () => {
        const { result } = renderHook(() =>
            usePolling({
                interval: 0,
                isPaused: false,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(true);
    });

    it('handles very short intervals', () => {
        const { result } = renderHook(() =>
            usePolling({
                interval: 1,
                isPaused: false,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(true);
    });

    it('handles very long intervals', () => {
        const { result } = renderHook(() =>
            usePolling({
                interval: 60000,
                isPaused: false,
                callback: mockCallback,
            }),
        );
        expect(result.current.isPolling).toBe(true);
    });
});
