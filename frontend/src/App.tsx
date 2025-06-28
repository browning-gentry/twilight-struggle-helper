import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import CardList from './components/CardList';
import ConfigModal from './components/ConfigModal';
import type { SortOption } from './types';
import './App.css';
import DeckArea from './components/DeckArea';
import cardsToHandIcon from './assets/hand.png';
import logo from './assets/logo.png';
import { usePolling } from './hooks/usePolling';
import { useGameState } from './hooks/useGameState';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { POLLING_INTERVAL } from './constants';

const App: React.FC = (): JSX.Element => {
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [sortOption, setSortOption] = useState<SortOption>('ops-asc');
    const [draggingCard, setDraggingCard] = useState<string | null>(null);
    const [isPollingPaused, setIsPollingPaused] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    const {
        gameStatus,
        currentFilename,
        errorMessage,
        setGameStatus,
        fetchGameStatus,
        handleResetState,
        removeCardFromHands,
        handleCardClick,
        handleMoveAllToOpponent,
    } = useGameState();

    const { onDragEnd, onDragStart } = useDragAndDrop({
        gameStatus,
        setGameStatus,
        setDraggingCard,
        setIsPollingPaused,
    });

    // Use the custom polling hook
    usePolling({
        interval: POLLING_INTERVAL,
        isPaused: isPollingPaused,
        callback: fetchGameStatus,
    });

    useEffect(() => {
        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 20; // 10 seconds if interval is 500ms

        const checkBackend = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/status');
                if (res.ok) {
                    if (!cancelled) setBackendStatus('ready');
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkBackend, 500);
                    } else {
                        if (!cancelled) setBackendStatus('error');
                    }
                }
            } catch (e) {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkBackend, 500);
                } else {
                    if (!cancelled) setBackendStatus('error');
                }
            }
        };
        checkBackend();
        return () => {
            cancelled = true;
        };
    }, []);

    if (backendStatus === 'loading') {
        return (
            <div className="app-loading">
                <div className="logo-container">
                    <img src={logo} alt="Twilight Struggle Helper" className="app-logo" />
                    <h1 className="app-title">Twilight Struggle Helper</h1>
                </div>
                <div className="spinner" />
                <div className="loading-text">Application loading...</div>
            </div>
        );
    }
    if (backendStatus === 'error') {
        return (
            <div className="app-loading">
                <div className="logo-container">
                    <img src={logo} alt="Twilight Struggle Helper" className="app-logo" />
                    <h1 className="app-title">Twilight Struggle Helper</h1>
                </div>
                <div
                    className="error-message"
                    style={{ margin: '2rem', fontSize: '1.5rem', color: 'red' }}
                >
                    Failed to connect to backend. Please ensure the backend is running.
                    <br />
                    Try restarting the app.
                </div>
            </div>
        );
    }

    const handleConfigSaved = (): void => {
        // Refresh the game status after config is saved
        fetchGameStatus();
    };

    return (
        <div className="app">
            <div className="setup">
                <div className="setup-left">
                    <div className="logo-container">
                        <img src={logo} alt="Twilight Struggle Helper" className="app-logo" />
                        <h1 className="app-title">Twilight Struggle Helper</h1>
                    </div>
                    <button onClick={handleResetState}>Clear Hands</button>
                    <select
                        value={sortOption}
                        onChange={(e): void => setSortOption(e.target.value as SortOption)}
                        className="sort-select"
                    >
                        <option value="ops-asc">Sort by Ops ↑</option>
                        <option value="ops-desc">Sort by Ops ↓</option>
                        <option value="name">Sort by Name ↑</option>
                    </select>
                </div>
                <div className="setup-right">
                    <div className="filename-display">
                        {currentFilename ? (
                            <span className="filename-text">{currentFilename}</span>
                        ) : (
                            <span className="filename-warning">No loaded file found</span>
                        )}
                    </div>
                    <button
                        onClick={(): void => setIsConfigModalOpen(true)}
                        className="config-button"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {errorMessage && (
                <div className="error-message">
                    <span className="error-text">{errorMessage}</span>
                </div>
            )}

            <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
                <div className="game-layout">
                    <div className="hands">
                        <CardList
                            title="Your Hand"
                            cards={gameStatus.yourHand}
                            droppableId="yourHand"
                            canDragFrom={true}
                            canDropTo={true}
                            isValidDropTarget={true}
                            sortOption={sortOption}
                            onCardRemove={removeCardFromHands}
                        />
                        <CardList
                            title="Opponent's Hand"
                            cards={gameStatus.opponentHand}
                            droppableId="opponentHand"
                            canDragFrom={true}
                            canDropTo={true}
                            isValidDropTarget={true}
                            sortOption={sortOption}
                            onCardRemove={removeCardFromHands}
                            headerButtons={[
                                {
                                    label: 'Move All from Hands to Opponent',
                                    icon: (
                                        <img
                                            src={cardsToHandIcon}
                                            className="header-icon"
                                            alt="Move from hands"
                                        />
                                    ),
                                    onClick: () => handleMoveAllToOpponent('cardsInHands'),
                                },
                            ]}
                        />
                        <CardList
                            title="Cards in Hands - From Log"
                            cards={gameStatus.cardsInHands}
                            droppableId="cardsInHands"
                            canDragFrom={true}
                            canDropTo={false}
                            isValidDropTarget={false}
                            sortOption={sortOption}
                            onCardClick={handleCardClick}
                        />
                    </div>
                    <DeckArea
                        cards={gameStatus.deck}
                        draggingCard={draggingCard}
                        sortOption={sortOption}
                        onCardClick={handleCardClick}
                    />
                    <div className="bottom-area">
                        <CardList
                            title="Discarded"
                            cards={gameStatus.discarded}
                            droppableId="discarded"
                            canDragFrom={false}
                            canDropTo={false}
                            isValidDropTarget={false}
                            sortOption={sortOption}
                        />
                        <CardList
                            title="Removed"
                            cards={gameStatus.removed}
                            droppableId="removed"
                            canDragFrom={false}
                            canDropTo={false}
                            isValidDropTarget={false}
                            sortOption={sortOption}
                        />
                    </div>
                </div>
            </DragDropContext>

            <ConfigModal
                isOpen={isConfigModalOpen}
                onClose={(): void => setIsConfigModalOpen(false)}
                onConfigSaved={handleConfigSaved}
            />
        </div>
    );
};

export default App;
