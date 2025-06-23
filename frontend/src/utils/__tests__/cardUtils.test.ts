import { cardsAreEqual, findCardIndex, isValidDestination } from '../cardUtils';
import type { Card } from '../../types';

describe('cardUtils', () => {
    describe('cardsAreEqual', () => {
        const card1: Card = { name: 'Test Card', side: 'US', ops: 3 };
        const card2: Card = { name: 'Test Card', side: 'US', ops: 3 };
        const card3: Card = { name: 'Different Card', side: 'US', ops: 3 };
        const card4: Card = { name: 'Test Card', side: 'USSR', ops: 3 };
        const card5: Card = { name: 'Test Card', side: 'US', ops: 2 };

        it('returns true for identical cards', () => {
            expect(cardsAreEqual(card1, card2)).toBe(true);
        });

        it('returns false for cards with different names', () => {
            expect(cardsAreEqual(card1, card3)).toBe(false);
        });

        it('returns false for cards with different sides', () => {
            expect(cardsAreEqual(card1, card4)).toBe(false);
        });

        it('returns false for cards with different ops', () => {
            expect(cardsAreEqual(card1, card5)).toBe(false);
        });

        it('returns false when only name matches', () => {
            const differentCard: Card = { name: 'Test Card', side: 'USSR', ops: 2 };
            expect(cardsAreEqual(card1, differentCard)).toBe(false);
        });

        it('returns false when only side matches', () => {
            const differentCard: Card = {
                name: 'Different Card',
                side: 'US',
                ops: 2,
            };
            expect(cardsAreEqual(card1, differentCard)).toBe(false);
        });

        it('returns false when only ops matches', () => {
            const differentCard: Card = {
                name: 'Different Card',
                side: 'USSR',
                ops: 3,
            };
            expect(cardsAreEqual(card1, differentCard)).toBe(false);
        });

        it('handles cards with zero ops', () => {
            const zeroOpsCard1: Card = {
                name: 'Scoring Card',
                side: 'Neutral',
                ops: 0,
            };
            const zeroOpsCard2: Card = {
                name: 'Scoring Card',
                side: 'Neutral',
                ops: 0,
            };
            const nonZeroOpsCard: Card = {
                name: 'Scoring Card',
                side: 'Neutral',
                ops: 1,
            };
            expect(cardsAreEqual(zeroOpsCard1, zeroOpsCard2)).toBe(true);
            expect(cardsAreEqual(zeroOpsCard1, nonZeroOpsCard)).toBe(false);
        });

        it('handles cards with special characters in names', () => {
            const specialCard1: Card = {
                name: 'Card with (parentheses) & symbols!',
                side: 'US',
                ops: 2,
            };
            const specialCard2: Card = {
                name: 'Card with (parentheses) & symbols!',
                side: 'US',
                ops: 2,
            };
            const differentSpecialCard: Card = {
                name: 'Card with (parentheses) & symbols',
                side: 'US',
                ops: 2,
            };
            expect(cardsAreEqual(specialCard1, specialCard2)).toBe(true);
            expect(cardsAreEqual(specialCard1, differentSpecialCard)).toBe(false);
        });
    });

    describe('findCardIndex', () => {
        const cards: Card[] = [
            { name: 'Card 1', side: 'US', ops: 3 },
            { name: 'Card 2', side: 'USSR', ops: 2 },
            { name: 'Card 3', side: 'Neutral', ops: 1 },
            { name: 'Card 1', side: 'US', ops: 4 }, // Same name, different ops
        ];

        it('finds card with exact match', () => {
            expect(findCardIndex(cards, 'Card 1', 'US', 3)).toBe(0);
        });

        it('finds card with different ops', () => {
            expect(findCardIndex(cards, 'Card 1', 'US', 4)).toBe(3);
        });

        it('returns -1 when card not found', () => {
            expect(findCardIndex(cards, 'Non-existent Card', 'US', 3)).toBe(-1);
        });

        it('returns -1 when side does not match', () => {
            expect(findCardIndex(cards, 'Card 1', 'USSR', 3)).toBe(-1);
        });

        it('returns -1 when ops does not match', () => {
            expect(findCardIndex(cards, 'Card 1', 'US', 5)).toBe(-1);
        });

        it('handles number ops parameter', () => {
            expect(findCardIndex(cards, 'Card 1', 'US', 3)).toBe(0);
        });

        it('handles empty array', () => {
            expect(findCardIndex([], 'Card 1', 'US', 3)).toBe(-1);
        });

        it('finds first match when multiple cards have same properties', () => {
            const duplicateCards: Card[] = [
                { name: 'Same Card', side: 'US', ops: 2 },
                { name: 'Same Card', side: 'US', ops: 2 },
                { name: 'Same Card', side: 'US', ops: 2 },
            ];
            expect(findCardIndex(duplicateCards, 'Same Card', 'US', 2)).toBe(0);
        });

        it('handles cards with zero ops', () => {
            const zeroOpsCards: Card[] = [
                { name: 'Scoring Card', side: 'Neutral', ops: 0 },
                { name: 'Action Card', side: 'US', ops: 3 },
            ];
            expect(findCardIndex(zeroOpsCards, 'Scoring Card', 'Neutral', 0)).toBe(0);
        });
    });

    describe('isValidDestination', () => {
        const usCard: Card = { name: 'US Card', side: 'US', ops: 3 };
        const ussrCard: Card = { name: 'USSR Card', side: 'USSR', ops: 2 };
        const neutralCard: Card = { name: 'Neutral Card', side: 'Neutral', ops: 1 };

        describe('deck-us destination', () => {
            it('allows US cards', () => {
                expect(isValidDestination(usCard, 'deck-us')).toBe(true);
            });

            it('rejects USSR cards', () => {
                expect(isValidDestination(ussrCard, 'deck-us')).toBe(false);
            });

            it('rejects Neutral cards', () => {
                expect(isValidDestination(neutralCard, 'deck-us')).toBe(false);
            });
        });

        describe('deck-ussr destination', () => {
            it('allows USSR cards', () => {
                expect(isValidDestination(ussrCard, 'deck-ussr')).toBe(true);
            });

            it('rejects US cards', () => {
                expect(isValidDestination(usCard, 'deck-ussr')).toBe(false);
            });

            it('rejects Neutral cards', () => {
                expect(isValidDestination(neutralCard, 'deck-ussr')).toBe(false);
            });
        });

        describe('deck-neutral destination', () => {
            it('allows Neutral cards', () => {
                expect(isValidDestination(neutralCard, 'deck-neutral')).toBe(true);
            });

            it('rejects US cards', () => {
                expect(isValidDestination(usCard, 'deck-neutral')).toBe(false);
            });

            it('rejects USSR cards', () => {
                expect(isValidDestination(ussrCard, 'deck-neutral')).toBe(false);
            });
        });

        describe('other destinations', () => {
            it('allows any card for yourHand', () => {
                expect(isValidDestination(usCard, 'yourHand')).toBe(true);
                expect(isValidDestination(ussrCard, 'yourHand')).toBe(true);
                expect(isValidDestination(neutralCard, 'yourHand')).toBe(true);
            });

            it('allows any card for opponentHand', () => {
                expect(isValidDestination(usCard, 'opponentHand')).toBe(true);
                expect(isValidDestination(ussrCard, 'opponentHand')).toBe(true);
                expect(isValidDestination(neutralCard, 'opponentHand')).toBe(true);
            });

            it('allows any card for cardsInHands', () => {
                expect(isValidDestination(usCard, 'cardsInHands')).toBe(true);
                expect(isValidDestination(ussrCard, 'cardsInHands')).toBe(true);
                expect(isValidDestination(neutralCard, 'cardsInHands')).toBe(true);
            });

            it('allows any card for unknown destinations', () => {
                expect(isValidDestination(usCard, 'unknown-destination')).toBe(true);
                expect(isValidDestination(ussrCard, 'unknown-destination')).toBe(true);
                expect(isValidDestination(neutralCard, 'unknown-destination')).toBe(true);
            });

            it('allows any card for empty string destination', () => {
                expect(isValidDestination(usCard, '')).toBe(true);
                expect(isValidDestination(ussrCard, '')).toBe(true);
                expect(isValidDestination(neutralCard, '')).toBe(true);
            });
        });

        describe('edge cases', () => {
            it('handles cards with zero ops', () => {
                const zeroOpsCard: Card = {
                    name: 'Scoring Card',
                    side: 'Neutral',
                    ops: 0,
                };
                expect(isValidDestination(zeroOpsCard, 'deck-neutral')).toBe(true);
                expect(isValidDestination(zeroOpsCard, 'deck-us')).toBe(false);
                expect(isValidDestination(zeroOpsCard, 'deck-ussr')).toBe(false);
            });

            it('handles cards with high ops values', () => {
                const highOpsCard: Card = {
                    name: 'High Ops Card',
                    side: 'US',
                    ops: 10,
                };
                expect(isValidDestination(highOpsCard, 'deck-us')).toBe(true);
                expect(isValidDestination(highOpsCard, 'deck-ussr')).toBe(false);
            });

            it('handles case sensitivity in destination IDs', () => {
                expect(isValidDestination(usCard, 'DECK-US')).toBe(true); // Should still work due to default case
                expect(isValidDestination(usCard, 'Deck-Us')).toBe(true); // Should still work due to default case
            });
        });
    });
});
