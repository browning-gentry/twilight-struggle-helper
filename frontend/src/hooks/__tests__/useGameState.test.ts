import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../useGameState';
import type { GameStatus, Card } from '../../types';
import { apiService as mockApiService } from '../../services/api';

const mockedApiService = jest.mocked(mockApiService);

jest.mock('../../utils/cardUtils', () => ({
    cardsAreEqual: (a: Card, b: Card) => a.name === b.name && a.side === b.side && a.ops === b.ops,
}));

jest.mock('../../services/api', () => {
    const mockApiService = {
        fetchGameStatus: jest.fn(),
        resetState: jest.fn(),
    };
    return { apiService: mockApiService };
});

describe('useGameState', () => {
    const defaultStatus: GameStatus = {
        status: 'no game data',
        turn: 0,
        deck: [],
        discarded: [],
        removed: [],
        cardsInHands: [],
        yourHand: [],
        opponentHand: [],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns initial state', () => {
        const { result } = renderHook(() => useGameState());
        expect(result.current.gameStatus).toEqual(defaultStatus);
        expect(result.current.currentFilename).toBeNull();
        expect(result.current.errorMessage).toBeNull();
    });

    it('setGameStatus updates the state', () => {
        const { result } = renderHook(() => useGameState());
        const newStatus = { ...defaultStatus, status: 'active', turn: 1 };
        act(() => {
            result.current.setGameStatus(newStatus);
        });
        expect(result.current.gameStatus).toEqual(newStatus);
    });

    it('clearGameStatus resets to default, can merge data', () => {
        const { result } = renderHook(() => useGameState());
        const newStatus = { ...defaultStatus, status: 'active', turn: 1 };
        act(() => {
            result.current.setGameStatus(newStatus);
        });
        act(() => {
            result.current.clearGameStatus({ turn: 5 });
        });
        expect(result.current.gameStatus).toEqual({ ...defaultStatus, turn: 5 });
    });

    it('removeCardFromHands removes from yourHand and opponentHand, puts back in deck/cardsInHands', () => {
        const card: Card = { name: 'Test Card', side: 'US', ops: 2 };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                yourHand: [card],
                opponentHand: [card],
                deck: [],
                cardsInHands: [],
            });
        });
        act(() => {
            result.current.removeCardFromHands(card);
        });
        // Should be back in deck
        expect(result.current.gameStatus.deck).toContainEqual(card);
        expect(result.current.gameStatus.yourHand).toHaveLength(0);
        expect(result.current.gameStatus.opponentHand).toHaveLength(0);
    });

    it('removeCardFromHands puts card back in cardsInHands if source is cardsInHands', () => {
        const card: Card = {
            name: 'Test Card',
            side: 'US',
            ops: 2,
            source: 'cardsInHands',
        };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                yourHand: [card],
                opponentHand: [],
                deck: [],
                cardsInHands: [],
            });
        });
        act(() => {
            result.current.removeCardFromHands(card);
        });
        expect(result.current.gameStatus.cardsInHands).toContainEqual(card);
        expect(result.current.gameStatus.yourHand).toHaveLength(0);
    });

    it('handleCardClick moves card from deck to yourHand with source', () => {
        const card: Card = { name: 'Deck Card', side: 'US', ops: 1 };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                deck: [card],
                yourHand: [],
            });
        });
        act(() => {
            result.current.handleCardClick(card);
        });
        expect(result.current.gameStatus.deck).toHaveLength(0);
        expect(result.current.gameStatus.yourHand[0]).toMatchObject({
            ...card,
            source: 'deck',
        });
    });

    it('handleCardClick moves card from cardsInHands to yourHand with source', () => {
        const card: Card = { name: 'Hand Card', side: 'US', ops: 1 };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                cardsInHands: [card],
                yourHand: [],
            });
        });
        act(() => {
            result.current.handleCardClick(card);
        });
        expect(result.current.gameStatus.cardsInHands).toHaveLength(0);
        expect(result.current.gameStatus.yourHand[0]).toMatchObject({
            ...card,
            source: 'cardsInHands',
        });
    });

    it('handleMoveAllToOpponent moves all from deck', () => {
        const card: Card = { name: 'Deck Card', side: 'US', ops: 1 };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                deck: [card],
                opponentHand: [],
            });
        });
        act(() => {
            result.current.handleMoveAllToOpponent('deck');
        });
        expect(result.current.gameStatus.deck).toHaveLength(0);
        expect(result.current.gameStatus.opponentHand).toContainEqual(card);
    });

    it('handleMoveAllToOpponent moves all from cardsInHands', () => {
        const card: Card = { name: 'Hand Card', side: 'US', ops: 1 };
        const { result } = renderHook(() => useGameState());
        act(() => {
            result.current.setGameStatus({
                ...defaultStatus,
                cardsInHands: [card],
                opponentHand: [],
            });
        });
        act(() => {
            result.current.handleMoveAllToOpponent('cardsInHands');
        });
        expect(result.current.gameStatus.cardsInHands).toHaveLength(0);
        expect(result.current.gameStatus.opponentHand).toContainEqual(card);
    });

    it('fetchGameStatus sets error and clears state on error', async () => {
        mockedApiService.fetchGameStatus.mockResolvedValue({
            error: 'fail',
            filename: 'file.log',
        });
        const { result } = renderHook(() => useGameState());
        await act(async () => {
            await result.current.fetchGameStatus();
        });
        expect(result.current.errorMessage).toBe('fail');
        expect(result.current.currentFilename).toBe('file.log');
        // Check that all main fields match defaultStatus
        const { gameStatus } = result.current;
        expect(gameStatus.status).toBe(defaultStatus.status);
        expect(gameStatus.turn).toBe(defaultStatus.turn);
        expect(gameStatus.deck).toEqual(defaultStatus.deck);
        expect(gameStatus.discarded).toEqual(defaultStatus.discarded);
        expect(gameStatus.removed).toEqual(defaultStatus.removed);
        expect(gameStatus.cardsInHands).toEqual(defaultStatus.cardsInHands);
        expect(gameStatus.yourHand).toEqual(defaultStatus.yourHand);
        expect(gameStatus.opponentHand).toEqual(defaultStatus.opponentHand);
        // Should not have error or filename fields
        expect((gameStatus as any).error).toBeUndefined();
        expect((gameStatus as any).filename).toBeUndefined();
    });

    it('fetchGameStatus sets state on success', async () => {
        const backendData = {
            status: 'active',
            turn: 2,
            deck: [{ name: 'A', side: 'US', ops: 1 }],
            discarded: [],
            removed: [],
            cardsInHands: [],
            yourHand: [],
            opponentHand: [],
            filename: 'file.log',
        };
        mockedApiService.fetchGameStatus.mockResolvedValue(backendData);
        const { result } = renderHook(() => useGameState());
        await act(async () => {
            await result.current.fetchGameStatus();
        });
        expect(result.current.errorMessage).toBeNull();
        expect(result.current.currentFilename).toBe('file.log');
        expect(result.current.gameStatus.status).toBe('active');
        expect(result.current.gameStatus.turn).toBe(2);
        expect(result.current.gameStatus.deck).toEqual([{ name: 'A', side: 'US', ops: 1 }]);
    });

    it('handleResetState resets hands', async () => {
        mockedApiService.resetState.mockResolvedValue({
            status: 'active',
            turn: 1,
            deck: [],
            discarded: [],
            removed: [],
            cardsInHands: [],
            yourHand: [{ name: 'A', side: 'US', ops: 1 }],
            opponentHand: [{ name: 'B', side: 'USSR', ops: 2 }],
        });
        const { result } = renderHook(() => useGameState());
        await act(async () => {
            await result.current.handleResetState();
        });
        expect(result.current.gameStatus.yourHand).toEqual([]);
        expect(result.current.gameStatus.opponentHand).toEqual([]);
        expect(result.current.gameStatus.status).toBe('active');
    });
});
