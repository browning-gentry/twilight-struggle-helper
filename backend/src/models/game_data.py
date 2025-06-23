"""
Game data models and formatting for Twilight Helper Backend
"""

import logging
from typing import Any

from pydantic import BaseModel, Field, ConfigDict

logger = logging.getLogger(__name__)


class Card(BaseModel):
    """Represents a card in the game"""
    name: str = Field(..., description="Card name")
    side: str = Field(..., description="Card side (US, USSR, Neutral)")
    ops: int = Field(default=0, description="Card operations value")


class GameStatus(BaseModel):
    """Represents the current game status"""
    model_config = ConfigDict(alias_generator=lambda x: ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(x.split('_'))))
    
    status: str = Field(..., description="Game status (ok, error, no game data)")
    filename: str | None = Field(default=None, description="Current log filename")
    turn: int | None = Field(default=None, description="Current turn number")
    deck: list[Card] = Field(default_factory=list, description="Cards in deck")
    discarded: list[Card] = Field(default_factory=list, description="Discarded cards")
    removed: list[Card] = Field(default_factory=list, description="Removed cards")
    cards_in_hands: list[Card] = Field(default_factory=list, description="Cards in hands")
    your_hand: list[Card] = Field(default_factory=list, description="Your hand")
    opponent_hand: list[Card] = Field(default_factory=list, description="Opponent hand")
    error: str | None = Field(default=None, description="Error message if status is error")


class ConfigModel(BaseModel):
    """Represents the application configuration"""
    log_file_path: str | None = Field(default=None, description="Path to the log file, or None for default")
    log_directory: str = Field(..., description="Directory containing log files")


class GameDataFormatter:
    """Handles formatting of game data for API responses"""

    @staticmethod
    def format_play_data(play: Any, game: Any) -> GameStatus:
        """
        Format play data to match frontend expectations

        Args:
            play: The current play object from the game
            game: The game object containing card definitions

        Returns:
            GameStatus: Formatted play data
        """
        def format_card(card_name: str) -> Card:
            if not hasattr(game, 'CARDS'):
                return Card(name=card_name, side="", ops=0)

            card = game.CARDS.get(card_name)
            if not card:
                logger.warning(f"Card not found in CARDS: {card_name}")
                return Card(name=card_name, side="", ops=0)

            # Handle real card objects
            try:
                name = str(getattr(card, 'name', card_name))
                side = str(getattr(card, 'side', ''))
                ops = int(getattr(card, 'ops', 0) or 0)
            except Exception:
                # Fallback - use card name and defaults
                name = str(card_name)
                side = ''
                ops = 0

            logger.debug(f"Formatting card: {name} (side: {side}, ops: {ops})")
            return Card(name=name, side=side, ops=ops)

        # Guard against None for all lists
        possible_draw_cards = play.possible_draw_cards if getattr(play, 'possible_draw_cards', None) is not None else []
        discarded_cards = play.discarded_cards if getattr(play, 'discarded_cards', None) is not None else []
        removed_cards = play.removed_cards if getattr(play, 'removed_cards', None) is not None else []
        cards_in_hands = play.cards_in_hands if getattr(play, 'cards_in_hands', None) is not None else []

        return GameStatus(
            status="ok",
            turn=play.turn if hasattr(play, 'turn') else None,
            deck=[format_card(card) for card in possible_draw_cards],
            discarded=[format_card(card) for card in discarded_cards],
            removed=[format_card(card) for card in removed_cards],
            cards_in_hands=[format_card(card) for card in cards_in_hands],
            your_hand=[],
            opponent_hand=[]
        )

    @staticmethod
    def create_error_response(error_message: str | None, filename: str | None = None) -> GameStatus:
        """
        Create a standardized error response

        Args:
            error_message: The error message to include (can be None)
            filename: Optional filename to include

        Returns:
            GameStatus: Standardized error response
        """
        return GameStatus(
            status="error",
            error=error_message,
            filename=filename,
            deck=[],
            discarded=[],
            removed=[],
            cards_in_hands=[],
            your_hand=[],
            opponent_hand=[]
        )

    @staticmethod
    def create_no_game_data_response(filename: str) -> GameStatus:
        """
        Create a response for when no game data is available

        Args:
            filename: The filename that was processed

        Returns:
            GameStatus: No game data response
        """
        return GameStatus(
            status="no game data",
            filename=filename,
            deck=[],
            discarded=[],
            removed=[],
            cards_in_hands=[],
            your_hand=[],
            opponent_hand=[]
        )
