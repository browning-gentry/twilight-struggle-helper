import os
import sys
import unittest
from unittest.mock import MagicMock

# Add the current directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import format_play_data


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions"""

    def test_format_play_data_with_valid_cards(self):
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

        # Set up mock cards with proper attributes
        mock_game.CARDS = {
            "Cuba": MagicMock(name="Cuba", side="USSR", ops=2),
            "Vietnam Revolts": MagicMock(name="Vietnam Revolts", side="USSR", ops=1),
            "Duck and Cover": MagicMock(name="Duck and Cover", side="US", ops=3),
            "Nuclear Test Ban": MagicMock(name="Nuclear Test Ban", side="US", ops=4),
            "The China Card": MagicMock(name="The China Card", side="USSR", ops=0),
            "De-Stalinization": MagicMock(name="De-Stalinization", side="USSR", ops=3),
        }

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Verify the structure
        self.assertEqual(result['turn'], 3)
        self.assertEqual(len(result['deck']), 2)
        self.assertEqual(len(result['discarded']), 1)
        self.assertEqual(len(result['removed']), 1)
        self.assertEqual(len(result['cards_in_hands']), 2)
        self.assertEqual(result['your_hand'], [])
        self.assertEqual(result['opponent_hand'], [])

        # Verify card formatting
        cuba_card = result['deck'][0]
        self.assertEqual(cuba_card['name'], "Cuba")
        self.assertEqual(cuba_card['side'], "USSR")
        self.assertEqual(cuba_card['ops'], 2)

    def test_format_play_data_with_missing_cards(self):
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

        # Should return the card name as string when card not found
        self.assertEqual(result['deck'][0], "Unknown Card")

    def test_format_play_data_with_none_ops(self):
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
        mock_game.CARDS = {
            "Test Card": MagicMock(name="Test Card", side="USSR", ops=None)
        }

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should default to 0 ops
        test_card = result['deck'][0]
        self.assertEqual(test_card['ops'], 0)

    def test_format_play_data_without_cards_attribute(self):
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
        del mock_game.CARDS

        # Call the function
        result = format_play_data(mock_play, mock_game)

        # Should return card name as string
        self.assertEqual(result['deck'][0], "Test Card")

    def test_format_play_data_without_turn_attribute(self):
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
        self.assertIsNone(result['turn'])


if __name__ == '__main__':
    unittest.main()
