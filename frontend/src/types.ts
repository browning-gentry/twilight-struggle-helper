export type SortOption = 'name' | 'ops-asc' | 'ops-desc';

export interface Card {
    name: string;
    side: 'US' | 'USSR' | 'Neutral';
    ops: number;
    source?: 'deck' | 'cardsInHands';
}

export interface GameStatus {
    status: string;
    turn?: number;
    deck: Card[];
    discarded: Card[];
    removed: Card[];
    cardsInHands: Card[];
    yourHand: Card[];
    opponentHand: Card[];
}
