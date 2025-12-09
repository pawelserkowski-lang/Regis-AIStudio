import unittest
from unittest.mock import MagicMock, patch
import os
import sys
import json
from io import BytesIO

# Add the directory containing index.py to the system path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../api'))

from index import handler

class TestBackendIntegration(unittest.TestCase):

    def setUp(self):
        # We simulate the Vercel environment where the handler is instantiated
        pass

    @patch('os.environ.get')
    def test_api_endpoint_structure(self, mock_env_get):
        """
        Tests the API endpoint structure and response format.
        This simulates a request from the frontend to the backend.
        """
        # Mock API Key presence
        mock_env_get.return_value = 'TEST_API_KEY'

        # Capture output
        mock_wfile = BytesIO()

        # Instantiate handler manually without triggering server logic
        h = handler.__new__(handler)
        h.wfile = mock_wfile
        h.send_response = MagicMock()
        h.send_header = MagicMock()
        h.end_headers = MagicMock()

        # Act: Simulate GET request
        h.do_GET()

        # Assert: Verify response headers
        h.send_response.assert_called_with(200)
        h.send_header.assert_called_with('Content-type', 'application/json')

        # Assert: Verify response body
        response_json = mock_wfile.getvalue().decode()
        data = json.loads(response_json)

        # Check keys expected by frontend or external consumers
        self.assertIn('status', data)
        self.assertIn('backend', data)
        self.assertIn('react_version_target', data)

        # Verify values align with project requirements
        self.assertEqual(data['status'], 'Alive')
        self.assertEqual(data['backend'], 'Python Serverless')

    @patch('os.environ.get')
    def test_api_security_check(self, mock_env_get):
        """
        Tests that the backend enforces security (API Key check).
        """
        # Mock missing API Key
        mock_env_get.return_value = None

        mock_wfile = BytesIO()

        h = handler.__new__(handler)
        h.wfile = mock_wfile
        h.send_response = MagicMock()
        h.send_header = MagicMock()
        h.end_headers = MagicMock()

        # Act
        h.do_GET()

        # Assert
        h.send_response.assert_called_with(500)
        self.assertIn('Missing Configuration', mock_wfile.getvalue().decode())

if __name__ == '__main__':
    unittest.main()
