"""
Tests for game data models and formatters
"""

import os
import sys
import unittest
from unittest.mock import MagicMock

# Add the src directory to the path so we can import from the modular structure
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'src'))

from src.models.game_data import Card, GameDataFormatter, GameStatus


class TestGameDataModels(unittest.TestCase):
    """Test cases for game data models and formatters"""

    def test_card_model(self):
        """Test Card Pydantic model"""
        card = Card(name="Test Card", side="USSR", ops=2)
        self.assertEqual(card.name, "Test Card")
        self.assertEqual(card.side, "USSR")
        self.assertEqual(card.ops, 2)

    def test_game_status_model(self):
        """Test GameStatus Pydantic model"""
        status = GameStatus(
            status="ok",
            filename="test.txt",
            turn=1,
            deck=[],
            discarded=[],
            removed=[],
            cards_in_hands=[],
            your_hand=[],
            opponent_hand=[]
        )
        self.assertEqual(status.status, "ok")
        self.assertEqual(status.filename, "test.txt")
        self.assertEqual(status.turn, 1)

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

        # Configure MagicMock objects to return proper values
        for card_name, mock_card in mock_game.CARDS.items():
            mock_card.name = card_name
            mock_card.side = mock_card.side
            mock_card.ops = mock_card.ops

        # Call the function
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        # Verify the structure
        self.assertEqual(result.status, "ok")
        self.assertEqual(result.turn, 3)
        self.assertEqual(len(result.deck), 2)
        self.assertEqual(len(result.discarded), 1)
        self.assertEqual(len(result.removed), 1)
        self.assertEqual(len(result.cards_in_hands), 2)
        self.assertEqual(result.your_hand, [])
        self.assertEqual(result.opponent_hand, [])

        # Verify card formatting
        cuba_card = result.deck[0]
        self.assertEqual(cuba_card.name, "Cuba")
        self.assertEqual(cuba_card.side, "USSR")
        self.assertEqual(cuba_card.ops, 2)

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
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        # Should return a Card object with the card name when card not found
        self.assertEqual(result.deck[0].name, "Unknown Card")
        self.assertEqual(result.deck[0].side, "")
        self.assertEqual(result.deck[0].ops, 0)

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
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        # Should default to 0 ops
        test_card = result.deck[0]
        self.assertEqual(test_card.ops, 0)

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
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        # Should return a Card object with the card name
        self.assertEqual(result.deck[0].name, "Test Card")
        self.assertEqual(result.deck[0].side, "")
        self.assertEqual(result.deck[0].ops, 0)

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
        result = GameDataFormatter.format_play_data(mock_play, mock_game)

        # Should handle missing turn gracefully
        self.assertIsNone(result.turn)

    def test_create_error_response(self):
        """Test create_error_response function"""
        error_response = GameDataFormatter.create_error_response("Test error", "test.txt")
        self.assertEqual(error_response.status, "error")
        self.assertEqual(error_response.error, "Test error")
        self.assertEqual(error_response.filename, "test.txt")
        self.assertEqual(error_response.deck, [])
        self.assertEqual(error_response.discarded, [])
        self.assertEqual(error_response.removed, [])
        self.assertEqual(error_response.cards_in_hands, [])
        self.assertEqual(error_response.your_hand, [])
        self.assertEqual(error_response.opponent_hand, [])

    def test_create_error_response_without_filename(self):
        """Test create_error_response function without filename"""
        error_response = GameDataFormatter.create_error_response("Test error")
        self.assertEqual(error_response.status, "error")
        self.assertEqual(error_response.error, "Test error")
        self.assertIsNone(error_response.filename)

    def test_create_no_game_data_response(self):
        """Test create_no_game_data_response function"""
        no_data_response = GameDataFormatter.create_no_game_data_response("test.txt")
        self.assertEqual(no_data_response.status, "no game data")
        self.assertEqual(no_data_response.filename, "test.txt")
        self.assertEqual(no_data_response.deck, [])
        self.assertEqual(no_data_response.discarded, [])
        self.assertEqual(no_data_response.removed, [])
        self.assertEqual(no_data_response.cards_in_hands, [])
        self.assertEqual(no_data_response.your_hand, [])
        self.assertEqual(no_data_response.opponent_hand, [])


if __name__ == '__main__':
    unittest.main()
