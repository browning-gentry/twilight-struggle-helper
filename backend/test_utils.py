import os
import sys
import unittest
from unittest.mock import MagicMock

# Add the current directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import format_play_data


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions"""

    def test_format_play_data_with_valid_cards(self) -> None:
        """Test format_play_data function with valid card data"""
        # Create mock game and play objects
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data
        mock_play.turn = 3
        mock_play.possible_draw_cards = ["Cuba", "Vietnam Revolts"]
        mock_play.discarded_cards = ["Duck and Cover"]
        mock_play.removed_cards = ["Nuclear Test Ban"]
        mock_play.cards_in_hands = ["The China Card", "De-Stalinization"]

        # Set up mock cards with proper attributes (use real values, not MagicMock for fields)
        def make_card(name: str, side: str, ops: int) -> MagicMock:
            card = MagicMock()
            card.name = name
            card.side = side
            card.ops = ops
            return card
        mock_game.CARDS = {
            "Cuba": make_card("Cuba", "USSR", 2),
            "Vietnam Revolts": make_card("Vietnam Revolts", "USSR", 1),
            "Duck and Cover": make_card("Duck and Cover", "US", 3),
            "Nuclear Test Ban": make_card("Nuclear Test Ban", "US", 4),
            "The China Card": make_card("The China Card", "USSR", 0),
            "De-Stalinization": make_card("De-Stalinization", "USSR", 3),
        }

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Verify the structure
        self.assertEqual(result["turn"], 3)
        self.assertEqual(len(result["deck"]), 2)
        self.assertEqual(len(result["discarded"]), 1)
        self.assertEqual(len(result["removed"]), 1)
        self.assertEqual(len(result["cards_in_hands"]), 2)
        self.assertEqual(result["your_hand"], [])
        self.assertEqual(result["opponent_hand"], [])

        # Verify card formatting
        cuba_card = result["deck"][0]
        self.assertEqual(cuba_card["name"], "Cuba")
        self.assertEqual(cuba_card["side"], "USSR")
        self.assertEqual(cuba_card["ops"], 2)

    def test_format_play_data_with_missing_cards(self) -> None:
        """Test format_play_data function when cards are missing from CARDS dict"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data with cards that don't exist in CARDS
        mock_play.turn = 1
        mock_play.possible_draw_cards = ["Unknown Card"]
        mock_play.discarded_cards = []
        mock_play.removed_cards = []
        mock_play.cards_in_hands = []

        # Empty CARDS dict
        mock_game.CARDS = {}

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should return a dict with name/side/ops for missing card
        self.assertEqual(result["deck"][0], {"name": "Unknown Card", "side": "unknown", "ops": 0})

    def test_format_play_data_with_none_ops(self) -> None:
        """Test format_play_data function when card ops is None"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data
        mock_play.turn = 1
        mock_play.possible_draw_cards = ["Test Card"]
        mock_play.discarded_cards = []
        mock_play.removed_cards = []
        mock_play.cards_in_hands = []

        # Card with None ops
        card = MagicMock()
        card.name = "Test Card"
        card.side = "USSR"
        card.ops = None
        mock_game.CARDS = {"Test Card": card}

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should default to 0 ops
        test_card = result["deck"][0]
        self.assertEqual(test_card["ops"], 0)

    def test_format_play_data_without_cards_attribute(self) -> None:
        """Test format_play_data function when game has no CARDS attribute"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data
        mock_play.turn = 1
        mock_play.possible_draw_cards = ["Test Card"]
        mock_play.discarded_cards = []
        mock_play.removed_cards = []
        mock_play.cards_in_hands = []

        # Game without CARDS attribute
        if hasattr(mock_game, "CARDS"):
            del mock_game.CARDS

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should return a dict for missing card
        self.assertEqual(result["deck"][0], {"name": "Test Card", "side": "unknown", "ops": 0})

    def test_format_play_data_without_turn_attribute(self) -> None:
        """Test format_play_data function when play has no turn attribute"""
        mock_game = MagicMock()
        mock_play = MagicMock()

        # Set up mock play data without turn
        mock_play.possible_draw_cards = []
        mock_play.discarded_cards = []
        mock_play.removed_cards = []
        mock_play.cards_in_hands = []

        # Remove turn attribute
        del mock_play.turn

        mock_game.CARDS = {}

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should handle missing turn gracefully
        self.assertIsNone(result["turn"])


if __name__ == "__main__":
    unittest.main()
