import React from 'react';
import CardList from './CardList';
import type {
    DroppableProvided,
    DroppableStateSnapshot,
    DraggableLocation,
} from '@hello-pangea/dnd';
import { Droppable } from '@hello-pangea/dnd';
import type { SortOption, Card } from '../types';

interface DeckAreaProps {
    cards: Card[];
    draggingCard: string | null;
    sortOption: SortOption;
    onCardClick?: (card: Card) => void;
}

const DeckArea: React.FC<DeckAreaProps> = ({
    cards,
    draggingCard,
    sortOption,
    onCardClick,
}): JSX.Element => {
    const usCards = cards.filter((card) => card.side === 'US');
    const ussrCards = cards.filter((card) => card.side === 'USSR');
    const neutralCards = cards.filter((card) => card.side === 'Neutral');

    const isValidDropTarget = (destination: DraggableLocation | null): boolean => {
        if (!destination || !draggingCard) return false;

        const [, side] = draggingCard.split('-');

        switch (destination.droppableId) {
            case 'deck-us':
                return side === 'US';
            case 'deck-ussr':
                return side === 'USSR';
            case 'deck-neutral':
                return side === 'Neutral';
            default:
                return false;
        }
    };

    return (
        <Droppable droppableId="deck">
            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot): JSX.Element => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`deck-container ${snapshot.isDraggingOver ? 'drop-target-valid' : ''}`}
                >
                    <h2 className="deck-title">Deck ({cards.length} cards)</h2>
                    <div className="deck-area">
                        <CardList
                            title="US Cards"
                            cards={usCards}
                            droppableId="deck-us"
                            canDragFrom={false}
                            canDropTo={false}
                            isValidDropTarget={isValidDropTarget}
                            sortOption={sortOption}
                            onCardClick={onCardClick}
                        />
                        <CardList
                            title="USSR Cards"
                            cards={ussrCards}
                            droppableId="deck-ussr"
                            canDragFrom={false}
                            canDropTo={false}
                            isValidDropTarget={isValidDropTarget}
                            sortOption={sortOption}
                            onCardClick={onCardClick}
                        />
                        <CardList
                            title="Neutral Cards"
                            cards={neutralCards}
                            droppableId="deck-neutral"
                            canDragFrom={false}
                            canDropTo={false}
                            isValidDropTarget={isValidDropTarget}
                            sortOption={sortOption}
                            onCardClick={onCardClick}
                        />
                    </div>
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default DeckArea;
