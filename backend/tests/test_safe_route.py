import unittest

from fastapi.testclient import TestClient

from app.main import app


class TestSafeRouteEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.endpoint = "/api/routes/safe"

    def _valid_payload(self):
        return {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            },
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }

    def _assert_bad_request(self, payload, detail):
        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": detail})

    def test_calculate_safe_route_success(self):
        response = self.client.post(self.endpoint, json=self._valid_payload())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success"})

    def test_calculate_safe_route_accepts_coordinate_boundaries(self):
        payload = {
            "origin": {
                "latitude": -90.0,
                "longitude": -180.0
            },
            "destination": {
                "latitude": 90.0,
                "longitude": 180.0
            }
        }

        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success"})

    def test_calculate_safe_route_accepts_numeric_strings(self):
        payload = {
            "origin": {
                "latitude": "-5.0930",
                "longitude": "-42.8060"
            },
            "destination": {
                "latitude": "-5.0945",
                "longitude": "-42.8080"
            }
        }

        response = self.client.post(self.endpoint, json=payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "success"})

    def test_missing_origin(self):
        payload = {
            "destination": {
                "latitude": -5.0945,
                "longitude": -42.8080
            }
        }

        self._assert_bad_request(payload, "Origin is required")

    def test_null_origin(self):
        payload = self._valid_payload()
        payload["origin"] = None

        self._assert_bad_request(payload, "Origin is required")

    def test_missing_destination(self):
        payload = {
            "origin": {
                "latitude": -5.0930,
                "longitude": -42.8060
            }
        }

        self._assert_bad_request(payload, "Destination is required")

    def test_null_destination(self):
        payload = self._valid_payload()
        payload["destination"] = None

        self._assert_bad_request(payload, "Destination is required")

    def test_origin_must_be_object_with_latitude_and_longitude(self):
        invalid_payloads = [
            {
                "origin": "Teresina",
                "destination": self._valid_payload()["destination"]
            },
            {
                "origin": {"latitude": -5.0930},
                "destination": self._valid_payload()["destination"]
            },
            {
                "origin": {"longitude": -42.8060},
                "destination": self._valid_payload()["destination"]
            }
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                self._assert_bad_request(
                    payload,
                    "Origin must contain latitude and longitude"
                )

    def test_destination_must_be_object_with_latitude_and_longitude(self):
        invalid_payloads = [
            {
                "origin": self._valid_payload()["origin"],
                "destination": "Teresina"
            },
            {
                "origin": self._valid_payload()["origin"],
                "destination": {"latitude": -5.0945}
            },
            {
                "origin": self._valid_payload()["origin"],
                "destination": {"longitude": -42.8080}
            }
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                self._assert_bad_request(
                    payload,
                    "Destination must contain latitude and longitude"
                )

    def test_coordinates_must_be_numbers(self):
        invalid_cases = [
            ("origin", "latitude"),
            ("origin", "longitude"),
            ("destination", "latitude"),
            ("destination", "longitude")
        ]

        for point, coordinate in invalid_cases:
            payload = self._valid_payload()
            payload[point][coordinate] = "invalid"

            with self.subTest(point=point, coordinate=coordinate):
                self._assert_bad_request(payload, "Coordinates must be numbers")

    def test_invalid_coordinates(self):
        invalid_cases = [
            ("origin", "latitude", -91.0, "Latitude must be between -90 and 90"),
            ("origin", "longitude", 181.0, "Longitude must be between -180 and 180"),
            ("destination", "latitude", 95.0, "Latitude must be between -90 and 90"),
            ("destination", "longitude", -185.0, "Longitude must be between -180 and 180")
        ]

        for point, coordinate, value, detail in invalid_cases:
            payload = self._valid_payload()
            payload[point][coordinate] = value

            with self.subTest(point=point, coordinate=coordinate, value=value):
                self._assert_bad_request(payload, detail)

    def test_safe_route_endpoint_only_accepts_post(self):
        response = self.client.get(self.endpoint)

        self.assertEqual(response.status_code, 405)
