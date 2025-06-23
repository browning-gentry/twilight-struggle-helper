import { useCallback } from 'react';
import type { DropResult, DragStart } from '@hello-pangea/dnd';
import type { GameStatus, Card } from '../types';
import { isValidDestination } from '../utils/cardUtils';
import { VALID_SOURCES, VALID_DESTINATIONS } from '../constants';

interface UseDragAndDropProps {
    gameStatus: GameStatus;
    setGameStatus: (status: GameStatus) => void;
    setDraggingCard: (cardId: string | null) => void;
    setIsPollingPaused: (paused: boolean) => void;
}

export const useDragAndDrop = ({
    gameStatus,
    setGameStatus,
    setDraggingCard,
    setIsPollingPaused,
}: UseDragAndDropProps): {
    onDragEnd: (result: DropResult) => void;
    onDragStart: (start: DragStart) => void;
} => {
    const onDragEnd = useCallback(
        (result: DropResult): void => {
            setDraggingCard(null);
            setIsPollingPaused(false);
            const { source, destination, draggableId } = result;

            if (!destination || !gameStatus) {
                return;
            }

            // Prevent dragging from deck sections to hands - only allow + button
            if (
                (source.droppableId === 'deck-us' ||
                    source.droppableId === 'deck-ussr' ||
                    source.droppableId === 'deck-neutral') &&
                (destination.droppableId === 'yourHand' ||
                    destination.droppableId === 'opponentHand')
            ) {
                return;
            }

            if (
                !VALID_SOURCES.includes(source.droppableId as (typeof VALID_SOURCES)[number]) ||
                !VALID_DESTINATIONS.includes(
                    destination.droppableId as (typeof VALID_DESTINATIONS)[number],
                )
            ) {
                return;
            }

            const newGameStatus = { ...gameStatus };

            // Get the correct source list
            const lists: Record<string, Card[]> = {
                'deck-us': newGameStatus.deck,
                'deck-ussr': newGameStatus.deck,
                'deck-neutral': newGameStatus.deck,
                cardsInHands: newGameStatus.cardsInHands,
                yourHand: newGameStatus.yourHand,
                opponentHand: newGameStatus.opponentHand,
            };

            const sourceList = lists[source.droppableId];
            if (!sourceList) {
                return;
            }

            // Extract card info from draggableId using underscore separator
            const [sanitizedName, side, ops] = draggableId.split('_');

            if (!ops) {
                return;
            }

            // Find the card by matching the sanitized name, side, and ops
            const cardIndex = sourceList.findIndex((card) => {
                const cardSanitizedName = card.name.replace(/[^a-zA-Z0-9\s]/g, '');
                return (
                    cardSanitizedName === sanitizedName &&
                    card.side === side &&
                    card.ops === parseInt(ops)
                );
            });

            if (cardIndex === -1) {
                return;
            }

            const [movedCard] = sourceList.splice(cardIndex, 1);
            if (!movedCard) {
                return;
            }

            // Check if card can be dropped in destination
            if (!isValidDestination(movedCard, destination.droppableId)) {
                sourceList.splice(cardIndex, 0, movedCard); // Put it back
                return;
            }

            // Add to the correct destination list
            const destinationList = {
                'deck-us': newGameStatus.deck,
                'deck-ussr': newGameStatus.deck,
                'deck-neutral': newGameStatus.deck,
                yourHand: newGameStatus.yourHand,
                opponentHand: newGameStatus.opponentHand,
            }[destination.droppableId] as Card[];
            if (!destinationList) {
                return;
            }

            destinationList.push(movedCard);

            setGameStatus(newGameStatus);
        },
        [gameStatus, setGameStatus, setDraggingCard, setIsPollingPaused],
    );

    const onDragStart = useCallback(
        (start: DragStart): void => {
            setDraggingCard(start.draggableId);
            setIsPollingPaused(true); // Pause polling when drag starts
        },
        [setDraggingCard, setIsPollingPaused],
    );

    return {
        onDragEnd,
        onDragStart,
    };
};
