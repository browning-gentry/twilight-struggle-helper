import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';
import type { GameStatus } from '../../types';
import type { DropResult, DragStart } from '@hello-pangea/dnd';
import { isValidDestination as mockIsValidDestination } from '../../utils/cardUtils';

// Mock dependencies
jest.mock('../../utils/cardUtils', () => ({
    isValidDestination: jest.fn(),
}));

const mockedIsValidDestination = jest.mocked(mockIsValidDestination);

describe('useDragAndDrop', () => {
    const mockSetGameStatus = jest.fn();
    const mockSetDraggingCard = jest.fn();
    const mockSetIsPollingPaused = jest.fn();

    const defaultGameStatus: GameStatus = {
        status: 'active',
        turn: 1,
        deck: [
            { name: 'US Card', side: 'US', ops: 3 },
            { name: 'USSR Card', side: 'USSR', ops: 2 },
        ],
        discarded: [],
        removed: [],
        cardsInHands: [{ name: 'Neutral Card', side: 'Neutral', ops: 1 }],
        yourHand: [],
        opponentHand: [],
    };

    const defaultProps = {
        gameStatus: defaultGameStatus,
        setGameStatus: mockSetGameStatus,
        setDraggingCard: mockSetDraggingCard,
        setIsPollingPaused: mockSetIsPollingPaused,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedIsValidDestination.mockReturnValue(true);
    });

    describe('onDragStart', () => {
        it('sets dragging card and pauses polling', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dragStart: DragStart = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
            };

            act(() => {
                result.current.onDragStart(dragStart);
            });

            expect(mockSetDraggingCard).toHaveBeenCalledWith('test-card');
            expect(mockSetIsPollingPaused).toHaveBeenCalledWith(true);
        });
    });

    describe('onDragEnd', () => {
        it('clears dragging card and resumes polling', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetDraggingCard).toHaveBeenCalledWith(null);
            expect(mockSetIsPollingPaused).toHaveBeenCalledWith(false);
        });

        it('returns early if no destination', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: null,
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('returns early if no gameStatus', () => {
            const { result } = renderHook(() =>
                useDragAndDrop({
                    ...defaultProps,
                    gameStatus: null as unknown,
                }),
            );
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('prevents dragging from deck sections to hands', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'US Card_US_3',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'deck-us', index: 0 },
                destination: { droppableId: 'yourHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('prevents invalid source droppableId', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'invalid-source', index: 0 },
                destination: { droppableId: 'yourHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('prevents invalid destination droppableId', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'invalid-dest', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('returns early if source list not found', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'test-card',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'unknown-source', index: 0 },
                destination: { droppableId: 'yourHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('returns early if draggableId format is invalid', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'invalid-format',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('returns early if card not found in source list', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'NonExistentCard_US_5',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('moves card from yourHand to opponentHand successfully', () => {
            const gameStatusWithHands: GameStatus = {
                ...defaultGameStatus,
                yourHand: [{ name: 'Test Card', side: 'US', ops: 2 }],
                opponentHand: [],
            };

            const { result } = renderHook(() =>
                useDragAndDrop({
                    ...defaultProps,
                    gameStatus: gameStatusWithHands,
                }),
            );

            const dropResult: DropResult = {
                draggableId: 'Test Card_US_2',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    yourHand: [],
                    opponentHand: [{ name: 'Test Card', side: 'US', ops: 2 }],
                }),
            );
        });

        it('moves card from cardsInHands to yourHand successfully', () => {
            const gameStatusWithCardsInHands: GameStatus = {
                ...defaultGameStatus,
                cardsInHands: [{ name: 'Hand Card', side: 'Neutral', ops: 1 }],
                yourHand: [],
            };

            const { result } = renderHook(() =>
                useDragAndDrop({
                    ...defaultProps,
                    gameStatus: gameStatusWithCardsInHands,
                }),
            );

            const dropResult: DropResult = {
                draggableId: 'Hand Card_Neutral_1',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'cardsInHands', index: 0 },
                destination: { droppableId: 'yourHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    cardsInHands: [],
                    yourHand: [{ name: 'Hand Card', side: 'Neutral', ops: 1 }],
                }),
            );
        });

        it('handles cards with special characters in name', () => {
            const gameStatusWithSpecialCard: GameStatus = {
                ...defaultGameStatus,
                yourHand: [{ name: 'Card with (parentheses) & symbols!', side: 'US', ops: 3 }],
                opponentHand: [],
            };

            const { result } = renderHook(() =>
                useDragAndDrop({
                    ...defaultProps,
                    gameStatus: gameStatusWithSpecialCard,
                }),
            );

            const dropResult: DropResult = {
                draggableId: 'Card with parentheses  symbols_US_3',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).toHaveBeenCalledWith(
                expect.objectContaining({
                    yourHand: [],
                    opponentHand: [
                        { name: 'Card with (parentheses) & symbols!', side: 'US', ops: 3 },
                    ],
                }),
            );
        });

        it('prevents invalid destination and puts card back', () => {
            mockedIsValidDestination.mockReturnValue(false);

            const gameStatusWithHands: GameStatus = {
                ...defaultGameStatus,
                yourHand: [{ name: 'Test Card', side: 'US', ops: 2 }],
                opponentHand: [],
            };

            const { result } = renderHook(() =>
                useDragAndDrop({
                    ...defaultProps,
                    gameStatus: gameStatusWithHands,
                }),
            );

            const dropResult: DropResult = {
                draggableId: 'Test Card_US_2',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'opponentHand', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            // Hook returns early without calling setGameStatus when destination is invalid
            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });

        it('returns early if destination list not found', () => {
            const { result } = renderHook(() => useDragAndDrop(defaultProps));
            const dropResult: DropResult = {
                draggableId: 'Test Card_US_2',
                type: 'DEFAULT',
                mode: 'FLUID',
                source: { droppableId: 'yourHand', index: 0 },
                destination: { droppableId: 'unknown-dest', index: 0 },
                reason: 'DROP',
                combine: null,
            };

            act(() => {
                result.current.onDragEnd(dropResult);
            });

            expect(mockSetGameStatus).not.toHaveBeenCalled();
        });
    });
});
