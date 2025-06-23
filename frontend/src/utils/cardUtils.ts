import type { Card } from '../types';

export const cardsAreEqual = (a: Card, b: Card): boolean => {
    return a.name === b.name && a.side === b.side && a.ops === b.ops;
};

export const findCardIndex = (cards: Card[], name: string, side: string, ops: number): number => {
    return cards.findIndex(
        (card) => card.name === name && card.side === side && card.ops === parseInt(ops.toString()),
    );
};

export const isValidDestination = (card: Card, destinationId: string): boolean => {
    switch (destinationId) {
        case 'deck-us':
            return card.side === 'US';
        case 'deck-ussr':
            return card.side === 'USSR';
        case 'deck-neutral':
            return card.side === 'Neutral';
        default:
            return true;
    }
};
