import { useState, useCallback } from 'react';
import type { GameStatus, Card } from '../types';
import { apiService } from '../services/api';
import { cardsAreEqual } from '../utils/cardUtils';

// Default game status
const DEFAULT_GAME_STATUS: GameStatus = {
    status: 'no game data',
    turn: 0,
    deck: [],
    discarded: [],
    removed: [],
    cardsInHands: [],
    yourHand: [],
    opponentHand: [],
};

interface UseGameStateReturn {
    gameStatus: GameStatus;
    currentFilename: string | null;
    errorMessage: string | null;
    setGameStatus: (status: GameStatus) => void;
    clearGameStatus: (data?: Partial<GameStatus>) => void;
    fetchGameStatus: () => Promise<void>;
    handleResetState: () => Promise<void>;
    removeCardFromHands: (card: Card) => void;
    handleCardClick: (card: Card) => void;
    handleMoveAllToOpponent: (source: 'deck' | 'cardsInHands') => void;
}

export const useGameState = (): UseGameStateReturn => {
    const [gameStatus, setGameStatus] = useState<GameStatus>(DEFAULT_GAME_STATUS);
    const [currentFilename, setCurrentFilename] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const clearGameStatus = useCallback((data?: Partial<GameStatus>): void => {
        const { status, turn, deck, discarded, removed, cardsInHands, yourHand, opponentHand } =
            data ?? {};
        setGameStatus({
            status: typeof status === 'string' ? status : DEFAULT_GAME_STATUS.status,
            turn: typeof turn === 'number' ? turn : (DEFAULT_GAME_STATUS.turn as number),
            deck: Array.isArray(deck) ? deck : DEFAULT_GAME_STATUS.deck,
            discarded: Array.isArray(discarded) ? discarded : DEFAULT_GAME_STATUS.discarded,
            removed: Array.isArray(removed) ? removed : DEFAULT_GAME_STATUS.removed,
            cardsInHands: Array.isArray(cardsInHands)
                ? cardsInHands
                : DEFAULT_GAME_STATUS.cardsInHands,
            yourHand: Array.isArray(yourHand) ? yourHand : DEFAULT_GAME_STATUS.yourHand,
            opponentHand: Array.isArray(opponentHand)
                ? opponentHand
                : DEFAULT_GAME_STATUS.opponentHand,
        });
    }, []);

    const removeCardFromHands = useCallback(
        (card: Card): void => {
            const newGameStatus = { ...gameStatus };
            newGameStatus.yourHand = newGameStatus.yourHand.filter((c) => !cardsAreEqual(c, card));
            newGameStatus.opponentHand = newGameStatus.opponentHand.filter(
                (c) => !cardsAreEqual(c, card),
            );

            // Put the card back to its original source
            if (card.source === 'cardsInHands') {
                newGameStatus.cardsInHands.push(card);
            } else {
                // Default to deck if no source is specified
                newGameStatus.deck.push(card);
            }

            setGameStatus(newGameStatus);
        },
        [gameStatus],
    );

    const handleCardClick = useCallback(
        (card: Card): void => {
            const newGameStatus = { ...gameStatus };
            let cardWithSource: Card;

            // Remove card from deck or cardsInHands
            if (newGameStatus.deck.some((c) => cardsAreEqual(c, card))) {
                newGameStatus.deck = newGameStatus.deck.filter((c) => !cardsAreEqual(c, card));
                cardWithSource = { ...card, source: 'deck' as const };
            } else if (newGameStatus.cardsInHands.some((c) => cardsAreEqual(c, card))) {
                newGameStatus.cardsInHands = newGameStatus.cardsInHands.filter(
                    (c) => !cardsAreEqual(c, card),
                );
                cardWithSource = { ...card, source: 'cardsInHands' as const };
            } else {
                // Fallback: just add with no source
                cardWithSource = { ...card };
            }

            // Add to your hand with source information
            newGameStatus.yourHand.push(cardWithSource);

            setGameStatus(newGameStatus);
        },
        [gameStatus],
    );

    const handleMoveAllToOpponent = useCallback(
        (source: 'deck' | 'cardsInHands'): void => {
            const newGameStatus = { ...gameStatus };

            if (source === 'deck') {
                // Move all cards from deck to opponent's hand
                newGameStatus.opponentHand.push(...newGameStatus.deck);
                newGameStatus.deck = [];
            } else {
                // Move all cards from cardsInHands to opponent's hand
                newGameStatus.opponentHand.push(...newGameStatus.cardsInHands);
                newGameStatus.cardsInHands = [];
            }

            setGameStatus(newGameStatus);
        },
        [gameStatus],
    );

    const fetchGameStatus = useCallback(async (): Promise<void> => {
        try {
            const data = await apiService.fetchGameStatus();

            if (data.error) {
                setCurrentFilename(data.filename || null);
                setErrorMessage(data.error);
                clearGameStatus({
                    status: data.status || 'no game data',
                    turn: data.turn || 0,
                    deck: data.deck || [],
                    discarded: data.discarded || [],
                    removed: data.removed || [],
                    cardsInHands: data.cards_in_hands || [],
                    yourHand: data.your_hand || [],
                    opponentHand: data.opponent_hand || [],
                });
                return;
            }

            // Clear any previous error message when successful
            setErrorMessage(null);
            setCurrentFilename(data.filename || null);

            // Merge backend data with local state
            setGameStatus((prevStatus) => {
                const backendData: GameStatus = {
                    status: data.status || 'no game data',
                    turn: data.turn || 0,
                    deck: data.deck || [],
                    discarded: data.discarded || [],
                    removed: data.removed || [],
                    cardsInHands: data.cards_in_hands || [],
                    yourHand: data.your_hand || [],
                    opponentHand: data.opponent_hand || [],
                };

                // If this is the first load or status changed, use backend data
                if (
                    prevStatus.status === 'no game data' ||
                    prevStatus.status !== backendData.status
                ) {
                    return backendData;
                }

                // Get the current hands (preserving local changes but removing discarded/removed cards)
                const currentYourHand = prevStatus.yourHand.filter(
                    (card) =>
                        !backendData.discarded.some((discarded) =>
                            cardsAreEqual(card, discarded),
                        ) && !backendData.removed.some((removed) => cardsAreEqual(card, removed)),
                );
                const currentOpponentHand = prevStatus.opponentHand.filter(
                    (card) =>
                        !backendData.discarded.some((discarded) =>
                            cardsAreEqual(card, discarded),
                        ) && !backendData.removed.some((removed) => cardsAreEqual(card, removed)),
                );

                // Filter out cards from deck and cardsInHands that are already in hands
                const allHandCards = [...currentYourHand, ...currentOpponentHand];
                const filteredDeck = backendData.deck.filter(
                    (card) => !allHandCards.some((handCard) => cardsAreEqual(card, handCard)),
                );
                const filteredCardsInHands = backendData.cardsInHands.filter(
                    (card) => !allHandCards.some((handCard) => cardsAreEqual(card, handCard)),
                );

                // Otherwise, merge backend data with local hand changes
                return {
                    ...backendData,
                    deck: filteredDeck,
                    cardsInHands: filteredCardsInHands,
                    yourHand: currentYourHand,
                    opponentHand: currentOpponentHand,
                };
            });
        } catch (error) {
            setCurrentFilename(null);
            clearGameStatus();
        }
    }, [clearGameStatus]);

    const handleResetState = useCallback(async (): Promise<void> => {
        try {
            const data = await apiService.resetState();

            // Reset the game state with empty hands
            setGameStatus({
                status: data.status || 'no game data',
                turn: data.turn || 0,
                deck: data.deck || [],
                discarded: data.discarded || [],
                removed: data.removed || [],
                cardsInHands: data.cards_in_hands || [],
                yourHand: [],
                opponentHand: [],
            });
        } catch (error) {
            // Handle error silently or set error message
        }
    }, []);

    return {
        gameStatus,
        currentFilename,
        errorMessage,
        setGameStatus,
        clearGameStatus,
        fetchGameStatus,
        handleResetState,
        removeCardFromHands,
        handleCardClick,
        handleMoveAllToOpponent,
    };
};
