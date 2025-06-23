// Polling configuration
export const POLLING_INTERVAL = 1000;

// Drag and drop constants
export const VALID_SOURCES = [
    'deck-us',
    'deck-ussr',
    'deck-neutral',
    'cardsInHands',
    'yourHand',
    'opponentHand',
] as const;
export const VALID_DESTINATIONS = ['yourHand', 'opponentHand', 'deck'] as const;

// Card display constants
export const MAX_CARD_NAME_LENGTH = 25;
export const CARD_NAME_TRUNCATE_LENGTH = 3; // For "..." suffix

// CSS class names
export const CARD_CLASSES = {
    US: 'card-us',
    USSR: 'card-ussr',
    NEUTRAL: 'card-neutral',
    SCORING: 'card-scoring',
    EUROPE_SCORING: 'europe-scoring',
    MIDDLE_EAST_SCORING: 'middle-east-scoring',
    SOUTHEAST_ASIA_SCORING: 'southeast-asia-scoring',
    ASIA_SCORING: 'asia-scoring',
    CENTRAL_AMERICA_SCORING: 'central-america-scoring',
    SOUTH_AMERICA_SCORING: 'south-america-scoring',
    AFRICA_SCORING: 'africa-scoring',
} as const;

// Droppable IDs
export const DROPPABLE_IDS = {
    DECK_US: 'deck-us',
    DECK_USSR: 'deck-ussr',
    DECK_NEUTRAL: 'deck-neutral',
    CARDS_IN_HANDS: 'cardsInHands',
    YOUR_HAND: 'yourHand',
    OPPONENT_HAND: 'opponentHand',
    DISCARDED: 'discarded',
    REMOVED: 'removed',
} as const;

// Tooltip messages
export const TOOLTIPS = {
    ADD_TO_HAND: 'Add to your hand',
    REMOVE_FROM_HAND: 'Remove from hand',
} as const;

// Error messages
export const ERROR_MESSAGES = {
    NO_LOG_FILES: 'No log files found in Twilight Struggle directory',
    CONFIGURED_FILE_NOT_FOUND: 'Configured log file not found:',
} as const;
