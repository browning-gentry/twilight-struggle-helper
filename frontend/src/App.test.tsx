import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import type { GameStatus } from './types';

// Mock the hooks
jest.mock('./hooks/useGameState');
jest.mock('./hooks/useDragAndDrop');
jest.mock('./hooks/usePolling');

// Mock the drag and drop context
jest.mock('@hello-pangea/dnd', () => ({
    DragDropContext: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drag-drop-context">{children}</div>
    ),
}));

// Mock the assets
jest.mock('./assets/hand.png', () => 'hand-icon.png');
jest.mock('./assets/logo.png', () => 'logo-icon.png');

// Mock the components
jest.mock('./components/CardList', () => {
    return function MockCardList({ title, cards, droppableId }: any) {
        return (
            <div data-testid={`card-list-${droppableId}`}>
                <h3>{title}</h3>
                <div data-testid={`cards-${droppableId}`}>
                    {cards?.map((card: any, index: number) => (
                        <div key={index} data-testid={`card-${droppableId}-${index}`}>
                            {card.name} ({card.ops})
                        </div>
                    ))}
                </div>
            </div>
        );
    };
});

jest.mock('./components/DeckArea', () => {
    return function MockDeckArea({ cards }: any) {
        return (
            <div data-testid="deck-area">
                <h3>Deck ({cards?.length || 0} cards)</h3>
                <div data-testid="deck-cards">
                    {cards?.map((card: any, index: number) => (
                        <div key={index} data-testid={`deck-card-${index}`}>
                            {card.name} ({card.ops})
                        </div>
                    ))}
                </div>
            </div>
        );
    };
});

jest.mock('./components/ConfigModal', () => {
    return function MockConfigModal({ isOpen, onClose, onConfigSaved }: any) {
        if (!isOpen) return null;
        return (
            <div data-testid="config-modal">
                <button onClick={onClose}>Close</button>
                <button onClick={onConfigSaved}>Save</button>
            </div>
        );
    };
});

import { useGameState as mockUseGameState } from './hooks/useGameState';
import { useDragAndDrop as mockUseDragAndDrop } from './hooks/useDragAndDrop';
import { usePolling as mockUsePolling } from './hooks/usePolling';

const mockedUseGameState = jest.mocked(mockUseGameState);
const mockedUseDragAndDrop = jest.mocked(mockUseDragAndDrop);
const mockedUsePolling = jest.mocked(mockUsePolling);

describe('App', () => {
    const mockGameStatus: GameStatus = {
        status: 'active',
        yourHand: [
            { name: 'US Card 1', side: 'US', ops: 3 },
            { name: 'US Card 2', side: 'US', ops: 2 },
        ],
        opponentHand: [{ name: 'USSR Card 1', side: 'USSR', ops: 4 }],
        cardsInHands: [{ name: 'Neutral Card 1', side: 'Neutral', ops: 1 }],
        deck: [
            { name: 'Deck Card 1', side: 'US', ops: 2 },
            { name: 'Deck Card 2', side: 'USSR', ops: 3 },
        ],
        discarded: [{ name: 'Discarded Card 1', side: 'US', ops: 1 }],
        removed: [{ name: 'Removed Card 1', side: 'USSR', ops: 2 }],
    };

    const defaultMockGameState = {
        gameStatus: mockGameStatus,
        currentFilename: 'test-game.log',
        errorMessage: null,
        setGameStatus: jest.fn(),
        fetchGameStatus: jest.fn(),
        handleResetState: jest.fn(),
        removeCardFromHands: jest.fn(),
        handleCardClick: jest.fn(),
        handleMoveAllToOpponent: jest.fn(),
        clearGameStatus: jest.fn(),
    };

    const defaultMockDragAndDrop = {
        onDragEnd: jest.fn(),
        onDragStart: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock fetch for /api/status to always return ok: true
        jest.spyOn(window, 'fetch').mockImplementation((input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.endsWith('/api/status')) {
                return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
            }
            // fallback for other fetches (could be extended if needed)
            return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
        });

        mockedUseGameState.mockReturnValue(defaultMockGameState);
        mockedUseDragAndDrop.mockReturnValue(defaultMockDragAndDrop);
        mockedUsePolling.mockReturnValue({ isPolling: false });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the app with all components', async () => {
        await act(async () => {
            render(<App />);
        });
        await waitFor(() => expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument());
        expect(screen.getByText('Twilight Struggle Helper')).toBeInTheDocument();
        expect(screen.getByText('Clear Hands')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Sort by Ops ↑')).toBeInTheDocument();
        expect(screen.getByText('⚙️')).toBeInTheDocument();
        expect(screen.getByText('test-game.log')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-yourHand')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-opponentHand')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-cardsInHands')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-discarded')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-removed')).toBeInTheDocument();
        expect(screen.getByTestId('deck-area')).toBeInTheDocument();
    });

    it('displays cards in all areas correctly', async () => {
        await act(async () => {
            render(<App />);
        });
        await waitFor(() => expect(screen.getByText('US Card 1 (3)')).toBeInTheDocument());
        expect(screen.getByText('US Card 2 (2)')).toBeInTheDocument();
        expect(screen.getByText('USSR Card 1 (4)')).toBeInTheDocument();
        expect(screen.getByText('Neutral Card 1 (1)')).toBeInTheDocument();
        expect(screen.getByText('Deck Card 1 (2)')).toBeInTheDocument();
        expect(screen.getByText('Deck Card 2 (3)')).toBeInTheDocument();
        expect(screen.getByText('Discarded Card 1 (1)')).toBeInTheDocument();
        expect(screen.getByText('Removed Card 1 (2)')).toBeInTheDocument();
    });

    it('shows error message when there is an error', async () => {
        const mockGameStateWithError = {
            ...defaultMockGameState,
            errorMessage: 'Test error message',
        };
        mockedUseGameState.mockReturnValue(mockGameStateWithError);
        await act(async () => {
            render(<App />);
        });
        await waitFor(() => expect(screen.getByText('Test error message')).toBeInTheDocument());
    });

    it('shows warning when no filename is loaded', async () => {
        const mockGameStateNoFile = {
            ...defaultMockGameState,
            currentFilename: null,
        };
        mockedUseGameState.mockReturnValue(mockGameStateNoFile);
        await act(async () => {
            render(<App />);
        });
        await waitFor(() => expect(screen.getByText('No loaded file found')).toBeInTheDocument());
    });

    it('handles sort option changes', async () => {
        await act(async () => {
            render(<App />);
        });
        const sortSelect = await screen.findByDisplayValue('Sort by Ops ↑');
        fireEvent.change(sortSelect, { target: { value: 'name' } });
        expect(sortSelect).toHaveValue('name');
    });

    it('opens config modal when config button is clicked', async () => {
        await act(async () => {
            render(<App />);
        });
        const configButton = await screen.findByText('⚙️');
        fireEvent.click(configButton);
        expect(screen.getByTestId('config-modal')).toBeInTheDocument();
    });

    it('calls handleResetState when Clear Hands button is clicked', async () => {
        await act(async () => {
            render(<App />);
        });
        const clearButton = await screen.findByText('Clear Hands');
        fireEvent.click(clearButton);
        expect(defaultMockGameState.handleResetState).toHaveBeenCalledTimes(1);
    });

    it('calls fetchGameStatus when config is saved', async () => {
        await act(async () => {
            render(<App />);
        });
        const configButton = await screen.findByText('⚙️');
        fireEvent.click(configButton);
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);
        expect(defaultMockGameState.fetchGameStatus).toHaveBeenCalledTimes(1);
    });

    it('closes config modal when close button is clicked', async () => {
        await act(async () => {
            render(<App />);
        });
        const configButton = await screen.findByText('⚙️');
        fireEvent.click(configButton);
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
        expect(screen.queryByTestId('config-modal')).not.toBeInTheDocument();
    });

    it('uses the polling hook with correct parameters', () => {
        render(<App />);

        expect(mockedUsePolling).toHaveBeenCalledWith({
            interval: 1000, // POLLING_INTERVAL
            isPaused: false,
            callback: defaultMockGameState.fetchGameStatus,
        });
    });

    it('uses the drag and drop hook with correct parameters', () => {
        render(<App />);

        expect(mockedUseDragAndDrop).toHaveBeenCalledWith({
            gameStatus: mockGameStatus,
            setGameStatus: defaultMockGameState.setGameStatus,
            setDraggingCard: expect.any(Function),
            setIsPollingPaused: expect.any(Function),
        });
    });

    it('renders all sort options in the select dropdown', async () => {
        await act(async () => {
            render(<App />);
        });
        const sortSelect = await screen.findByDisplayValue('Sort by Ops ↑');
        const options = Array.from(sortSelect.querySelectorAll('option'));
        expect(options).toHaveLength(3);
    });

    it('renders empty state when no cards are present', async () => {
        const emptyGameState = {
            ...defaultMockGameState,
            gameStatus: {
                status: 'active',
                yourHand: [],
                opponentHand: [],
                cardsInHands: [],
                deck: [],
                discarded: [],
                removed: [],
            },
        };
        mockedUseGameState.mockReturnValue(emptyGameState);
        await act(async () => {
            render(<App />);
        });
        await waitFor(() => expect(screen.getByTestId('card-list-yourHand')).toBeInTheDocument());
        expect(screen.getByTestId('card-list-opponentHand')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-cardsInHands')).toBeInTheDocument();
        expect(screen.getByTestId('card-list-discarded')).toBeInTheDocument();
    });
});
