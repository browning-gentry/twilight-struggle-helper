import React from 'react';
import type {
    DroppableProvided,
    DroppableStateSnapshot,
    DraggableProvided,
    DraggableLocation,
} from '@hello-pangea/dnd';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { SortOption, Card } from '../types';
import {
    MAX_CARD_NAME_LENGTH,
    CARD_NAME_TRUNCATE_LENGTH,
    CARD_CLASSES,
    TOOLTIPS,
} from '../constants';

const formatCard = (card: Card): string => {
    // Handle invalid cards
    if (!card || typeof card !== 'object' || !card.name) {
        return 'Invalid Card';
    }

    const opsStr = card.ops > 0 ? `(${card.ops}) ` : ''; // Ops first, with space
    const displayName = card.name;

    // Calculate remaining space for name after ops
    const remainingSpace = MAX_CARD_NAME_LENGTH - opsStr.length;

    if (displayName.length > remainingSpace) {
        return opsStr + displayName.slice(0, remainingSpace - CARD_NAME_TRUNCATE_LENGTH) + '...';
    }

    return opsStr + displayName;
};

const getCardClass = (card: Card): string => {
    // Validate card object
    if (!card || typeof card !== 'object') {
        return '';
    }
    if (!card.name) {
        return '';
    }
    const cardName = card.name.toLowerCase();
    if (cardName.includes('scoring')) {
        let regionClass = '';
        if (cardName.includes('europe')) {
            regionClass = CARD_CLASSES.EUROPE_SCORING;
        } else if (cardName.includes('middle east')) {
            regionClass = CARD_CLASSES.MIDDLE_EAST_SCORING;
        } else if (cardName.includes('southeast asia')) {
            regionClass = CARD_CLASSES.SOUTHEAST_ASIA_SCORING;
        } else if (cardName.includes('asia scoring')) {
            regionClass = CARD_CLASSES.ASIA_SCORING;
        } else if (cardName.includes('central america')) {
            regionClass = CARD_CLASSES.CENTRAL_AMERICA_SCORING;
        } else if (cardName.includes('south america')) {
            regionClass = CARD_CLASSES.SOUTH_AMERICA_SCORING;
        } else if (cardName.includes('africa')) {
            regionClass = CARD_CLASSES.AFRICA_SCORING;
        }
        return `${CARD_CLASSES.SCORING} ${regionClass}`;
    }
    if (card.side === 'USSR') {
        return CARD_CLASSES.USSR;
    }
    if (card.side === 'US') {
        return CARD_CLASSES.US;
    }
    if (card.side === 'Neutral') {
        return CARD_CLASSES.NEUTRAL;
    }
    return '';
};

// Helper function to compare sides in a consistent order
const compareSides = (a: string, b: string): number => {
    const sideOrder = { US: 0, USSR: 1, Neutral: 2 };
    return sideOrder[a as keyof typeof sideOrder] - sideOrder[b as keyof typeof sideOrder];
};

const sortCards = (cards: Card[], sortOption: SortOption): Card[] => {
    // Filter out invalid cards first
    const validCards = cards.filter(
        (card) =>
            card &&
            typeof card === 'object' &&
            card.name &&
            typeof card.name === 'string' &&
            card.side &&
            typeof card.ops === 'number',
    );

    return validCards.sort((a, b) => {
        switch (sortOption) {
            case 'ops-asc': {
                const opsCompare = a.ops - b.ops;
                if (opsCompare !== 0) return opsCompare;
                const sideCompare = compareSides(a.side, b.side);
                if (sideCompare !== 0) return sideCompare;
                return a.name.localeCompare(b.name);
            }
            case 'ops-desc': {
                const opsCompareDesc = b.ops - a.ops;
                if (opsCompareDesc !== 0) return opsCompareDesc;
                const sideCompareDesc = compareSides(a.side, b.side);
                if (sideCompareDesc !== 0) return sideCompareDesc;
                return a.name.localeCompare(b.name);
            }
            case 'name':
            default: {
                return a.name.localeCompare(b.name);
            }
        }
    });
};

interface HeaderButton {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
}

interface CardContentProps {
    card: Card;
    onCardClick?: ((card: Card) => void) | undefined;
    onCardRemove?: ((card: Card) => void) | undefined;
}

const CardContent: React.FC<CardContentProps> = ({
    card,
    onCardClick,
    onCardRemove,
}): JSX.Element => (
    <div className="card-content">
        <span className="card-text">{formatCard(card)}</span>
        {(onCardClick || onCardRemove) && (
            <button
                onClick={(e): void => {
                    e.stopPropagation();
                    if (onCardClick) onCardClick(card);
                    if (onCardRemove) onCardRemove(card);
                }}
                className="add-to-hand-button"
                title={onCardClick ? TOOLTIPS.ADD_TO_HAND : TOOLTIPS.REMOVE_FROM_HAND}
            >
                {onCardClick ? '+' : '-'}
            </button>
        )}
    </div>
);

interface CardListProps {
    title: string;
    cards?: Card[];
    droppableId: string;
    canDragFrom: boolean;
    canDropTo: boolean;
    isValidDropTarget?: boolean | ((destination: DraggableLocation | null) => boolean);
    sortOption: SortOption;
    onCardClick?: ((card: Card) => void) | undefined;
    onCardRemove?: ((card: Card) => void) | undefined;
    headerButtons?: HeaderButton[];
}

const CardList: React.FC<CardListProps> = ({
    title,
    cards = [],
    droppableId,
    canDragFrom,
    canDropTo,
    isValidDropTarget = true,
    sortOption,
    onCardClick,
    onCardRemove,
    headerButtons = [],
}): JSX.Element => {
    const sortedCards = sortCards(cards, sortOption);

    return (
        <div className="card-list">
            <div className="card-list-header">
                <div className="header-title">
                    <h3>
                        {title} ({sortedCards.length})
                    </h3>
                    {headerButtons.length > 0 && (
                        <div className="header-icons">
                            {headerButtons.map((button) => (
                                <button
                                    key={button.label}
                                    onClick={button.onClick}
                                    className="header-icon-button"
                                    title={button.label}
                                >
                                    {button.icon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Droppable droppableId={droppableId} isDropDisabled={!canDropTo}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot): JSX.Element => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`card-list-content \
                            ${snapshot.isDraggingOver ? (isValidDropTarget ? 'drop-target-valid' : 'drop-target-invalid') : ''}\
                        `}
                    >
                        {sortedCards.map((card, index) => (
                            <Draggable
                                key={`${card.name}_${card.side}_${card.ops}`}
                                draggableId={`${card.name.replace(/[^a-zA-Z0-9\s]/g, '')}_${card.side}_${card.ops}`}
                                index={index}
                                isDragDisabled={!canDragFrom}
                            >
                                {(provided: DraggableProvided): JSX.Element => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`card ${getCardClass(card)}`}
                                        style={{
                                            ...provided.draggableProps.style,
                                            userSelect: 'none',
                                        }}
                                    >
                                        <CardContent
                                            card={card}
                                            onCardClick={onCardClick}
                                            onCardRemove={onCardRemove}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default CardList;
