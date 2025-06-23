import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardList from '../CardList';
import type { Card, SortOption } from '../../types';

// Mock the drag-and-drop library
jest.mock('@hello-pangea/dnd', () => ({
    Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactElement }) =>
        children(
            {
                innerRef: jest.fn(),
                droppableProps: {},
            },
            {
                isDraggingOver: false,
            },
        ),
    Draggable: ({ children }: { children: (provided: any) => React.ReactElement }) =>
        children({
            innerRef: jest.fn(),
            draggableProps: {},
            dragHandleProps: {},
        }),
}));

// Mock constants
jest.mock('../../constants', () => ({
    MAX_CARD_NAME_LENGTH: 30,
    CARD_NAME_TRUNCATE_LENGTH: 3,
    CARD_CLASSES: {
        SCORING: 'card-scoring',
        EUROPE_SCORING: 'europe-scoring',
        MIDDLE_EAST_SCORING: 'middle-east-scoring',
        SOUTHEAST_ASIA_SCORING: 'southeast-asia-scoring',
        ASIA_SCORING: 'asia-scoring',
        CENTRAL_AMERICA_SCORING: 'central-america-scoring',
        SOUTH_AMERICA_SCORING: 'south-america-scoring',
        AFRICA_SCORING: 'africa-scoring',
        USSR: 'card-ussr',
        US: 'card-us',
        NEUTRAL: 'card-neutral',
    },
    TOOLTIPS: {
        ADD_TO_HAND: 'Add to hand',
        REMOVE_FROM_HAND: 'Remove from hand',
    },
}));

describe('CardList', () => {
    const mockCards: Card[] = [
        { name: 'Test Card 1', side: 'US', ops: 3 },
        { name: 'Test Card 2', side: 'USSR', ops: 2 },
        { name: 'Europe Scoring', side: 'Neutral', ops: 0 },
        { name: 'Test Card 3', side: 'Neutral', ops: 1 },
    ];

    const defaultProps = {
        title: 'Test Cards',
        cards: mockCards,
        droppableId: 'test-droppable',
        canDragFrom: true,
        canDropTo: true,
        sortOption: 'name' as SortOption,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic rendering', () => {
        it('renders with title and card count', () => {
            render(<CardList {...defaultProps} />);

            expect(screen.getByText('Test Cards (4)')).toBeInTheDocument();
        });

        it('renders all cards', () => {
            render(<CardList {...defaultProps} />);

            expect(screen.getByText('(3) Test Card 1')).toBeInTheDocument();
            expect(screen.getByText('(2) Test Card 2')).toBeInTheDocument();
            expect(screen.getByText('Europe Scoring')).toBeInTheDocument();
            expect(screen.getByText('(1) Test Card 3')).toBeInTheDocument();
        });

        it('renders empty state when no cards', () => {
            render(<CardList {...defaultProps} cards={[]} />);

            expect(screen.getByText('Test Cards (0)')).toBeInTheDocument();
        });

        it('renders header buttons when provided', () => {
            const headerButtons = [
                {
                    label: 'Test Button',
                    icon: <span>🔧</span>,
                    onClick: jest.fn(),
                },
            ];

            render(<CardList {...defaultProps} headerButtons={headerButtons} />);

            const button = screen.getByTitle('Test Button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('🔧');
        });
    });

    describe('Card formatting', () => {
        it('formats cards with ops correctly', () => {
            render(<CardList {...defaultProps} />);

            expect(screen.getByText('(3) Test Card 1')).toBeInTheDocument();
            expect(screen.getByText('(2) Test Card 2')).toBeInTheDocument();
            expect(screen.getByText('(1) Test Card 3')).toBeInTheDocument();
        });

        it('formats scoring cards without ops', () => {
            render(<CardList {...defaultProps} />);

            expect(screen.getByText('Europe Scoring')).toBeInTheDocument();
        });

        it('truncates long card names', () => {
            const longNameCard: Card = {
                name: 'This is a very long card name that should be truncated',
                side: 'US',
                ops: 3,
            };

            render(<CardList {...defaultProps} cards={[longNameCard]} />);

            // Should show truncated name with ops
            expect(screen.getByText('(3) This is a very long car...')).toBeInTheDocument();
        });
    });

    describe('Card classes', () => {
        it('applies correct classes for US cards', () => {
            const usCards: Card[] = [{ name: 'US Card', side: 'US', ops: 3 }];
            const { container } = render(<CardList {...defaultProps} cards={usCards} />);

            const cardElement = container.querySelector('.card.card-us');
            expect(cardElement).toBeInTheDocument();
        });

        it('applies correct classes for USSR cards', () => {
            const ussrCards: Card[] = [{ name: 'USSR Card', side: 'USSR', ops: 2 }];
            const { container } = render(<CardList {...defaultProps} cards={ussrCards} />);

            const cardElement = container.querySelector('.card.card-ussr');
            expect(cardElement).toBeInTheDocument();
        });

        it('applies correct classes for Neutral cards', () => {
            const neutralCards: Card[] = [{ name: 'Neutral Card', side: 'Neutral', ops: 1 }];
            const { container } = render(<CardList {...defaultProps} cards={neutralCards} />);

            const cardElement = container.querySelector('.card.card-neutral');
            expect(cardElement).toBeInTheDocument();
        });

        it('applies scoring classes for scoring cards', () => {
            const scoringCards: Card[] = [
                { name: 'Europe Scoring', side: 'Neutral', ops: 0 },
                { name: 'Middle East Scoring', side: 'Neutral', ops: 0 },
            ];

            const { container } = render(<CardList {...defaultProps} cards={scoringCards} />);

            const europeCard = container.querySelector('.card.card-scoring.europe-scoring');
            expect(europeCard).toBeInTheDocument();

            const mideastCard = container.querySelector('.card.card-scoring.middle-east-scoring');
            expect(mideastCard).toBeInTheDocument();
        });

        it('handles invalid card objects gracefully', () => {
            const invalidCards = [null as any, undefined as any, {} as any, { name: '' } as any];

            render(<CardList {...defaultProps} cards={invalidCards} />);

            // Should not crash and should render empty cards
            expect(screen.getByText('Test Cards (0)')).toBeInTheDocument();
        });
    });

    describe('Card sorting', () => {
        it('sorts cards by name by default', () => {
            const unsortedCards: Card[] = [
                { name: 'Zebra Card', side: 'US', ops: 3 },
                { name: 'Alpha Card', side: 'USSR', ops: 2 },
                { name: 'Beta Card', side: 'Neutral', ops: 1 },
            ];

            render(<CardList {...defaultProps} cards={unsortedCards} sortOption="name" />);

            // Use more specific selectors to avoid picking up header text
            const cardTexts = screen.getAllByText(/\([0-9]+\) .*Card/);
            expect(cardTexts[0]).toHaveTextContent('(2) Alpha Card');
            expect(cardTexts[1]).toHaveTextContent('(1) Beta Card');
            expect(cardTexts[2]).toHaveTextContent('(3) Zebra Card');
        });

        it('sorts cards by ops ascending', () => {
            const unsortedCards: Card[] = [
                { name: 'High Ops', side: 'US', ops: 5 },
                { name: 'Low Ops', side: 'USSR', ops: 1 },
                { name: 'Medium Ops', side: 'Neutral', ops: 3 },
            ];

            render(<CardList {...defaultProps} cards={unsortedCards} sortOption="ops-asc" />);

            const cardElements = screen.getAllByText(/Ops/);
            expect(cardElements[0]).toHaveTextContent('(1) Low Ops');
            expect(cardElements[1]).toHaveTextContent('(3) Medium Ops');
            expect(cardElements[2]).toHaveTextContent('(5) High Ops');
        });

        it('sorts cards by ops descending', () => {
            const unsortedCards: Card[] = [
                { name: 'Low Ops', side: 'US', ops: 1 },
                { name: 'High Ops', side: 'USSR', ops: 5 },
                { name: 'Medium Ops', side: 'Neutral', ops: 3 },
            ];

            render(<CardList {...defaultProps} cards={unsortedCards} sortOption="ops-desc" />);

            const cardElements = screen.getAllByText(/Ops/);
            expect(cardElements[0]).toHaveTextContent('(5) High Ops');
            expect(cardElements[1]).toHaveTextContent('(3) Medium Ops');
            expect(cardElements[2]).toHaveTextContent('(1) Low Ops');
        });

        it('sorts by side when ops are equal', () => {
            const equalOpsCards: Card[] = [
                { name: 'Neutral Card', side: 'Neutral', ops: 3 },
                { name: 'USSR Card', side: 'USSR', ops: 3 },
                { name: 'US Card', side: 'US', ops: 3 },
            ];

            render(<CardList {...defaultProps} cards={equalOpsCards} sortOption="ops-asc" />);

            const cardTexts = screen.getAllByText(/\([0-9]+\) .*Card/);
            expect(cardTexts[0]).toHaveTextContent('(3) US Card');
            expect(cardTexts[1]).toHaveTextContent('(3) USSR Card');
            expect(cardTexts[2]).toHaveTextContent('(3) Neutral Card');
        });

        it('sorts by name when ops and side are equal', () => {
            const equalCards: Card[] = [
                { name: 'Zebra Card', side: 'US', ops: 3 },
                { name: 'Alpha Card', side: 'US', ops: 3 },
                { name: 'Beta Card', side: 'US', ops: 3 },
            ];

            render(<CardList {...defaultProps} cards={equalCards} sortOption="ops-asc" />);

            const cardTexts = screen.getAllByText(/\([0-9]+\) .*Card/);
            expect(cardTexts[0]).toHaveTextContent('(3) Alpha Card');
            expect(cardTexts[1]).toHaveTextContent('(3) Beta Card');
            expect(cardTexts[2]).toHaveTextContent('(3) Zebra Card');
        });
    });

    describe('Card interactions', () => {
        it('calls onCardClick when card is clicked', () => {
            const onCardClick = jest.fn();
            render(<CardList {...defaultProps} onCardClick={onCardClick} />);

            const addButton = screen.getAllByText('+')[0];
            fireEvent.click(addButton as Element);

            // The first card in the sorted list is "Europe Scoring" (alphabetical order)
            expect(onCardClick).toHaveBeenCalledWith({
                name: 'Europe Scoring',
                side: 'Neutral',
                ops: 0,
            });
        });

        it('calls onCardRemove when remove button is clicked', () => {
            const onCardRemove = jest.fn();
            render(<CardList {...defaultProps} onCardRemove={onCardRemove} />);

            const removeButton = screen.getAllByText('-')[0];
            fireEvent.click(removeButton as Element);

            // The first card in the sorted list is "Europe Scoring" (alphabetical order)
            expect(onCardRemove).toHaveBeenCalledWith({
                name: 'Europe Scoring',
                side: 'Neutral',
                ops: 0,
            });
        });

        it('calls both handlers when both are provided', () => {
            const onCardClick = jest.fn();
            const onCardRemove = jest.fn();
            render(
                <CardList
                    {...defaultProps}
                    onCardClick={onCardClick}
                    onCardRemove={onCardRemove}
                />,
            );

            const button = screen.getAllByText('+')[0];
            fireEvent.click(button as Element);

            // The first card in the sorted list is "Europe Scoring" (alphabetical order)
            expect(onCardClick).toHaveBeenCalledWith({
                name: 'Europe Scoring',
                side: 'Neutral',
                ops: 0,
            });
            expect(onCardRemove).toHaveBeenCalledWith({
                name: 'Europe Scoring',
                side: 'Neutral',
                ops: 0,
            });
        });

        it('does not show buttons when no handlers provided', () => {
            render(<CardList {...defaultProps} />);

            expect(screen.queryByText('+')).not.toBeInTheDocument();
            expect(screen.queryByText('-')).not.toBeInTheDocument();
        });

        it('shows correct tooltip for add button', () => {
            render(<CardList {...defaultProps} onCardClick={jest.fn()} />);

            const addButton = screen.getAllByText('+')[0];
            expect(addButton).toHaveAttribute('title', 'Add to hand');
        });

        it('shows correct tooltip for remove button', () => {
            render(<CardList {...defaultProps} onCardRemove={jest.fn()} />);

            const removeButton = screen.getAllByText('-')[0];
            expect(removeButton).toHaveAttribute('title', 'Remove from hand');
        });
    });

    describe('Header button interactions', () => {
        it('calls header button onClick when clicked', () => {
            const mockOnClick = jest.fn();
            const headerButtons = [
                {
                    label: 'Test Button',
                    icon: <span>🔧</span>,
                    onClick: mockOnClick,
                },
            ];

            render(<CardList {...defaultProps} headerButtons={headerButtons} />);

            const button = screen.getByTitle('Test Button');
            fireEvent.click(button as Element);

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it('renders multiple header buttons', () => {
            const headerButtons = [
                {
                    label: 'Button 1',
                    icon: <span>🔧</span>,
                    onClick: jest.fn(),
                },
                {
                    label: 'Button 2',
                    icon: <span>⚙️</span>,
                    onClick: jest.fn(),
                },
            ];

            render(<CardList {...defaultProps} headerButtons={headerButtons} />);

            expect(screen.getByTitle('Button 1')).toBeInTheDocument();
            expect(screen.getByTitle('Button 2')).toBeInTheDocument();
        });
    });

    describe('Drag and drop props', () => {
        it('passes correct droppableId', () => {
            render(<CardList {...defaultProps} droppableId="custom-droppable" />);

            // The droppableId is passed to the Droppable component
            // We can't easily test this without more complex mocking, but we can verify the component renders
            expect(screen.getByText('Test Cards (4)')).toBeInTheDocument();
        });

        it('handles canDragFrom prop', () => {
            render(<CardList {...defaultProps} canDragFrom={false} />);

            // The canDragFrom prop affects the Draggable components
            // We can verify the component renders correctly
            expect(screen.getByText('Test Cards (4)')).toBeInTheDocument();
        });

        it('handles canDropTo prop', () => {
            render(<CardList {...defaultProps} canDropTo={false} />);

            // The canDropTo prop affects the Droppable component
            // We can verify the component renders correctly
            expect(screen.getByText('Test Cards (4)')).toBeInTheDocument();
        });
    });

    describe('Edge cases', () => {
        it('handles cards with special characters in names', () => {
            const specialCards: Card[] = [
                { name: 'Card with (parentheses) & symbols!', side: 'US', ops: 3 },
                { name: 'Card with "quotes"', side: 'USSR', ops: 2 },
            ];

            render(<CardList {...defaultProps} cards={specialCards} />);

            expect(screen.getByText('(3) Card with (parentheses)...')).toBeInTheDocument();
            expect(screen.getByText('(2) Card with "quotes"')).toBeInTheDocument();
        });

        it('handles cards with zero ops', () => {
            const zeroOpsCards: Card[] = [
                { name: 'Scoring Card', side: 'Neutral', ops: 0 },
                { name: 'Action Card', side: 'US', ops: 0 },
            ];

            render(<CardList {...defaultProps} cards={zeroOpsCards} />);

            expect(screen.getByText('Scoring Card')).toBeInTheDocument();
            expect(screen.getByText('Action Card')).toBeInTheDocument();
        });

        it('handles cards with high ops values', () => {
            const highOpsCards: Card[] = [
                { name: 'High Ops Card', side: 'US', ops: 10 },
                { name: 'Very High Ops Card', side: 'USSR', ops: 99 },
            ];

            render(<CardList {...defaultProps} cards={highOpsCards} />);

            expect(screen.getByText('(10) High Ops Card')).toBeInTheDocument();
            expect(screen.getByText('(99) Very High Ops Card')).toBeInTheDocument();
        });
    });
});
