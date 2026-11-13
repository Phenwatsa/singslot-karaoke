"""Offline unit tests for deploy/smoke_test.py (the network is 100% mocked via urllib.request.urlopen).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers:
  - All 4 public checks pass (health, ready, root SPA HTML, 9 seeded rooms)
  - Full authenticated flow (login, me, logout) when credentials provided
  - Login skipped without credentials
  - HTTP 500 (HTTPError) handling and retry
  - HTTP 404 (HTTPError) handling and retry
  - Network timeout (TimeoutError) handling and retry
  - Connection refused (URLError) handling and retry
  - Malformed non-JSON responses (JSONDecodeError / ValueError)
  - Database not ready fails even if HTTP answers
  - Rooms missing or not seeded fails
  - Session is logged out even if authenticated check fails
  - Mismatched single-credential error
"""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch
import urllib.error
import urllib.parse
import urllib.request

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


def make_mock_response(body_bytes, status=200):
    m = MagicMock()
    m.__enter__.return_value = m
    m.__exit__.return_value = False
    m.read.return_value = body_bytes
    m.status = status
    return m


class SmokeTests(unittest.TestCase):
    def fake_urlopen(self, req, timeout=30):
        url = req.full_url if hasattr(req, 'full_url') else str(req)
        parsed = urllib.parse.urlparse(url)
        path = parsed.path
        mock_rooms = [{'id': f'room-{i}', 'roomNumber': f'R0{i}'} for i in range(1, 10)]
        table = {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"status":"ready","db":"connected"}',
            '/': b'<!DOCTYPE html><html><head><title>SingSlot</title></head><body><div id="root"></div></body></html>',
            '/api/rooms': json.dumps({'success': True, 'data': {'rooms': mock_rooms}}).encode(),
            '/api/auth/login': b'{"success":true,"token":"test-jwt-token"}',
            '/api/auth/me': b'{"success":true,"user":{"id":"test-id","email":"smoke@singslot.local"}}',
            '/api/auth/logout': b'{"success":true,"message":"Logged out"}',
        }
        if path in table:
            return make_mock_response(table[path])
        raise urllib.error.HTTPError(url, 404, 'Not Found', hdrs=None, fp=None)

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(urllib.request, 'urlopen', side_effect=self.fake_urlopen) as mock_urlopen:
            smoke.check('https://singslot-demo.test')
            self.assertEqual(mock_urlopen.call_count, 4)

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@singslot.local', 'SMOKE_PASSWORD': 'test-pass-123'}, clear=True)
    def test_authenticated_flow_passes_with_credentials(self):
        with patch.object(urllib.request, 'urlopen', side_effect=self.fake_urlopen) as mock_urlopen:
            smoke.check('https://singslot-demo.test')
            self.assertEqual(mock_urlopen.call_count, 7)

    @patch.dict('os.environ', {}, clear=True)
    def test_http_500_error_retries_and_raises(self):
        def error_500(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/health' in url:
                raise urllib.error.HTTPError(url, 500, 'Internal Server Error', hdrs=None, fp=None)
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=error_500), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Smoke check failed: /api/health'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_http_404_error_retries_and_raises(self):
        def error_404(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/rooms' in url:
                raise urllib.error.HTTPError(url, 404, 'Not Found', hdrs=None, fp=None)
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=error_404), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Smoke check failed: /api/rooms'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_network_timeout_retries_and_raises(self):
        def timeout_error(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/ready' in url:
                raise TimeoutError('Connection timed out')
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=timeout_error), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Smoke check failed: /api/ready'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_connection_refused_retries_and_raises(self):
        def refused_error(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/health' in url:
                raise urllib.error.URLError('Connection refused')
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=refused_error), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Smoke check failed: /api/health'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_malformed_non_json_response_raises(self):
        def bad_json(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/ready' in url:
                return make_mock_response(b'INVALID NON JSON')
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=bad_json), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Smoke check failed: /api/ready'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/ready' in url:
                return make_mock_response(b'{"status":"error","db":"disconnected"}')
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=disconnected), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_rooms_not_seeded_fails(self):
        def unseeded_rooms(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            if '/api/rooms' in url:
                return make_mock_response(b'{"success":true,"data":{"rooms":[]}}')
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=unseeded_rooms), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/rooms'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@singslot.local', 'SMOKE_PASSWORD': 'test-pass-123'}, clear=True)
    def test_session_is_logged_out_even_if_me_fails(self):
        called_paths = []

        def broken_me(req, timeout=30):
            url = req.full_url if hasattr(req, 'full_url') else str(req)
            parsed = urllib.parse.urlparse(url)
            called_paths.append(parsed.path)
            if parsed.path == '/api/auth/me':
                raise urllib.error.HTTPError(url, 500, 'Server Error', hdrs=None, fp=None)
            return self.fake_urlopen(req, timeout)

        with patch.object(urllib.request, 'urlopen', side_effect=broken_me):
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://singslot-demo.test')
            self.assertIn('/api/auth/logout', called_paths)

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@singslot.local'}, clear=True)
    def test_mismatched_single_credential_raises(self):
        with patch.object(urllib.request, 'urlopen', side_effect=self.fake_urlopen):
            with self.assertRaisesRegex(RuntimeError, 'Set both SMOKE_EMAIL and SMOKE_PASSWORD'):
                smoke.check('https://singslot-demo.test')


if __name__ == '__main__':
    unittest.main()
