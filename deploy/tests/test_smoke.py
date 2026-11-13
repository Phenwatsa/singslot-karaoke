"""Offline unit tests for deploy/smoke_test.py (the network is 100% mocked).

Run (repo root):  python3 -m unittest discover -s deploy/tests -p 'test_smoke.py'
CI runs it too (.github/workflows/ci-docker.yml).

Covers:
  - All 4 public checks pass (health, ready, root SPA HTML, 9 seeded rooms)
  - Login skipped without credentials
  - Database not ready fails even if HTTP answers
  - Rooms missing or not seeded fails
  - Session is logged out even if authenticated check fails
  - Mismatched single-credential error
"""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('smoke', Path(__file__).parents[1] / 'smoke_test.py')
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class SmokeTests(unittest.TestCase):
    def response(self, base, path, data=None, token=None):
        mock_rooms = [{'id': f'room-{i}', 'roomNumber': f'R0{i}'} for i in range(1, 10)]
        return {
            '/api/health': b'{"status":"ok"}',
            '/api/ready': b'{"status":"ready","db":"connected"}',
            '/': b'<!DOCTYPE html><html><head><title>SingSlot</title></head><body><div id="root"></div></body></html>',
            '/api/rooms': json.dumps({'success': True, 'data': {'rooms': mock_rooms}}).encode(),
            '/api/auth/login': b'{"success":true,"token":"test-jwt-token"}',
            '/api/auth/me': b'{"success":true,"user":{"id":"test-id","email":"smoke@singslot.local"}}',
            '/api/auth/logout': b'{"success":true,"message":"Logged out"}',
        }[path]

    @patch.dict('os.environ', {}, clear=True)
    def test_public_checks_pass_and_skip_optional_login(self):
        with patch.object(smoke, 'request', side_effect=self.response) as req:
            smoke.check('https://singslot-demo.test')
            self.assertEqual(req.call_count, 4)

    @patch.dict('os.environ', {}, clear=True)
    def test_db_not_ready_fails_even_when_http_responds(self):
        def disconnected(base, path, **kwargs):
            if path == '/api/ready':
                return b'{"status":"error","db":"disconnected"}'
            return self.response(base, path)

        with patch.object(smoke, 'request', side_effect=disconnected), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/ready'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {}, clear=True)
    def test_rooms_not_seeded_fails(self):
        def unseeded_rooms(base, path, **kwargs):
            if path == '/api/rooms':
                return b'{"success":true,"data":{"rooms":[]}}'
            return self.response(base, path)

        with patch.object(smoke, 'request', side_effect=unseeded_rooms), patch.object(smoke.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, '/api/rooms'):
                smoke.check('https://singslot-demo.test')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@singslot.local', 'SMOKE_PASSWORD': 'test-pass-123'}, clear=True)
    def test_session_is_logged_out_even_if_me_fails(self):
        def broken_me(base, path, data=None, token=None):
            if path == '/api/auth/me':
                raise ValueError('Broken response')
            return self.response(base, path, data, token)

        with patch.object(smoke, 'request', side_effect=broken_me) as req:
            with self.assertRaisesRegex(RuntimeError, 'Login smoke'):
                smoke.check('https://singslot-demo.test')
            self.assertEqual(req.call_args.args[1], '/api/auth/logout')

    @patch.dict('os.environ', {'SMOKE_EMAIL': 'smoke@singslot.local'}, clear=True)
    def test_mismatched_single_credential_raises(self):
        with self.assertRaisesRegex(RuntimeError, 'Set both SMOKE_EMAIL and SMOKE_PASSWORD'):
            smoke.check('https://singslot-demo.test')


if __name__ == '__main__':
    unittest.main()

