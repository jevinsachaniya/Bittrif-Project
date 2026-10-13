"""Visitor tracking integration tests, isolated from the store's database.

Run from the project root: python -m unittest discover -s backend -p test_product_visits.py
"""
import os
import tempfile
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from fastapi.testclient import TestClient


class ProductVisitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.previous_data_dir = os.environ.get("DATA_DIR")
        os.environ["DATA_DIR"] = cls.temp_dir.name
        import main
        from database import get_db, init_db
        cls.get_db = staticmethod(get_db)
        cls.init_db = staticmethod(init_db)
        cls.client_context = TestClient(main.app)
        cls.client = cls.client_context.__enter__()
        cls.product = cls.client.get("/api/products").json()[0]
        cls.other_product = cls.client.get("/api/products").json()[1]

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        cls.temp_dir.cleanup()
        if cls.previous_data_dir is None:
            os.environ.pop("DATA_DIR", None)
        else:
            os.environ["DATA_DIR"] = cls.previous_data_dir

    def setUp(self):
        conn = self.get_db()
        conn.execute("DELETE FROM product_visit_events")
        conn.execute("DELETE FROM product_visits")
        conn.execute("DELETE FROM auth_sessions")
        conn.execute("DELETE FROM users")
        conn.commit()
        conn.close()
        self.visit = {
            "product_id": self.product["id"],
            "visitor_id": str(uuid.uuid4()),
            "visit_key": str(uuid.uuid4()),
        }

    def record(self, visit=None, **kwargs):
        return self.client.post("/api/product-visits", json=visit or self.visit, **kwargs)

    def contact(self, **values):
        body = {"visitor_id": self.visit["visitor_id"], "name": "Guest Client", "email": "guest@example.test"}
        body.update(values)
        return self.client.put(f"/api/product-visits/{self.visit['visit_key']}/contact", json=body)

    def visitors(self, **params):
        response = self.client.get("/api/admin/product-visits", params=params)
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_skipped_guest_is_recorded_once_and_secrets_are_not_exposed(self):
        self.assertEqual(self.record().status_code, 200)
        self.assertEqual(self.record().status_code, 200)
        result = self.visitors()
        self.assertEqual(result["total"], 1)
        visit = result["items"][0]
        self.assertEqual(visit["source"], "guest")
        self.assertIsNone(visit["customer_name"])
        self.assertNotIn("visit_key", visit)
        self.assertNotIn("visitor_id", visit)
        self.assertTrue(visit["created_at"])
        self.assertEqual(visit["visit_count"], 1)

    def test_concurrent_retries_do_not_duplicate_visits(self):
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(lambda _: self.record().status_code, range(8)))
        self.assertEqual(statuses, [200] * 8)
        self.assertEqual(self.visitors()["total"], 1)
        self.assertEqual(self.visitors()["items"][0]["visit_count"], 1)

    def test_repeat_visits_update_one_entry_and_keep_first_visit(self):
        self.record()
        conn = self.get_db()
        conn.execute("UPDATE product_visits SET created_at='2020-01-01 00:00:00', last_visited_at='2020-01-01 00:00:00'")
        conn.commit()
        conn.close()
        repeat = {**self.visit, "visit_key": str(uuid.uuid4())}
        self.assertEqual(self.record(repeat).status_code, 200)
        self.assertEqual(self.record(repeat).status_code, 200)
        result = self.visitors()
        self.assertEqual(result["total"], 1)
        row = result["items"][0]
        self.assertEqual(row["visit_count"], 2)
        self.assertEqual(row["created_at"], "2020-01-01 00:00:00")
        self.assertGreater(row["last_visited_at"], row["created_at"])
        conn = self.get_db()
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM product_visits").fetchone()[0], 1)
        conn.close()

    def test_concurrent_distinct_visits_update_same_entry(self):
        visits = [{**self.visit, "visit_key": str(uuid.uuid4())} for _ in range(8)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            statuses = list(pool.map(lambda visit: self.record(visit).status_code, visits))
        self.assertEqual(statuses, [200] * 8)
        self.assertEqual(self.visitors()["total"], 1)
        self.assertEqual(self.visitors()["items"][0]["visit_count"], 8)

    def test_different_clients_and_products_keep_separate_entries(self):
        self.record()
        self.record({**self.visit, "visit_key": str(uuid.uuid4()), "product_id": self.other_product["id"]})
        self.record({**self.visit, "visit_key": str(uuid.uuid4()), "visitor_id": str(uuid.uuid4())})
        self.assertEqual(self.visitors()["total"], 3)

    def test_guest_contact_updates_prior_and_future_visits_in_session(self):
        self.record()
        self.record({**self.visit, "visit_key": str(uuid.uuid4())})
        self.assertEqual(self.contact(email=" Guest@Example.Test ", phone="+91 98765 43210").status_code, 200)
        self.record({**self.visit, "visit_key": str(uuid.uuid4())})
        self.assertEqual(self.contact(email=" Guest@Example.Test ", phone="+91 98765 43210").status_code, 200)
        rows = self.visitors(source="shared")["items"]
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["visit_count"], 3)
        self.assertTrue(all(row["customer_email"] == "guest@example.test" for row in rows))
        self.assertTrue(all(row["customer_phone"] == "+91 98765 43210" for row in rows))
        self.assertEqual(self.visitors(search="98765")["total"], 1)
        self.assertEqual(self.visitors(source="guest")["total"], 0)

    def test_optional_contact_validation_and_wrong_session(self):
        self.record()
        self.assertEqual(self.contact(email=None, phone=None).status_code, 422)
        self.assertEqual(self.contact(email="bad email").status_code, 422)
        self.assertEqual(self.contact(name="  ").status_code, 422)
        self.assertEqual(self.contact(phone="123").status_code, 422)
        self.assertEqual(self.contact(visitor_id=str(uuid.uuid4())).status_code, 404)
        self.assertEqual(self.contact(email=None, phone="9876543210").status_code, 200)

    def test_logged_in_details_come_from_verified_account(self):
        registration = self.client.post("/api/auth/register", json={
            "name": "Account Client", "email": "account@example.test", "phone": "9876543210", "password": "test-password-123",
        })
        self.assertEqual(registration.status_code, 200)
        user = registration.json()
        self.assertNotIn("password", user)
        login = self.client.post("/api/auth/login", json={"email": user["email"], "password": "test-password-123"}).json()
        self.assertEqual(login["phone"], "9876543210")
        self.assertEqual(self.record(headers={"Authorization": f"Bearer {login['token']}"}).status_code, 200)
        row = self.visitors(source="account")["items"][0]
        self.assertEqual(row["customer_name"], "Account Client")
        self.assertEqual(row["customer_email"], user["email"])
        self.assertEqual(row["customer_phone"], "9876543210")
        second_login = self.client.post("/api/auth/login", json={"email": user["email"], "password": "test-password-123"}).json()
        other_device = {**self.visit, "visit_key": str(uuid.uuid4()), "visitor_id": str(uuid.uuid4())}
        self.assertEqual(self.record(other_device, headers={"Authorization": f"Bearer {second_login['token']}"}).status_code, 200)
        self.assertEqual(self.visitors(source="account")["total"], 1)
        self.assertEqual(self.visitors(source="account")["items"][0]["visit_count"], 2)
        self.assertEqual(self.contact().status_code, 409)
        spoof = {**self.visit, "visit_key": str(uuid.uuid4()), "user_id": user["id"]}
        self.assertEqual(self.record(spoof).status_code, 200)
        self.assertEqual(self.visitors(source="guest")["total"], 1)
        self.assertEqual(self.record({**self.visit, "visit_key": str(uuid.uuid4())}, headers={"Authorization": "Bearer invalid"}).status_code, 401)
        conn = self.get_db()
        conn.execute("UPDATE auth_sessions SET expires_at=datetime('now', '-1 day')")
        conn.commit()
        conn.close()
        self.assertEqual(self.record(headers={"Authorization": f"Bearer {login['token']}"}).status_code, 401)

    def test_search_filter_pagination_and_input_validation(self):
        for _ in range(26):
            self.assertEqual(self.record({**self.visit, "visit_key": str(uuid.uuid4()), "visitor_id": str(uuid.uuid4())}).status_code, 200)
        first = self.visitors(page=1)
        second = self.visitors(page=2)
        self.assertEqual(first["total"], 26)
        self.assertEqual(len(first["items"]), 25)
        self.assertEqual(len(second["items"]), 1)
        self.assertGreater(first["items"][0]["id"], second["items"][0]["id"])
        self.assertEqual(self.visitors(search=self.product["name"])["total"], 26)
        self.assertEqual(self.visitors(search="absent-product")["total"], 0)
        for params in ({"page": 0}, {"page_size": 101}, {"source": "invalid"}):
            self.assertEqual(self.client.get("/api/admin/product-visits", params=params).status_code, 422)
        self.assertEqual(self.record({**self.visit, "product_id": 999999}).status_code, 404)
        self.assertEqual(self.record({**self.visit, "visit_key": "bad-key"}).status_code, 422)
        self.assertEqual(self.record().status_code, 200)
        self.assertEqual(self.record({**self.visit, "visitor_id": str(uuid.uuid4())}).status_code, 409)

    def test_database_initialization_preserves_existing_visits(self):
        self.record()
        self.init_db()
        self.init_db()
        self.assertEqual(self.visitors()["total"], 1)

    def test_legacy_duplicate_migration_preserves_details_counts_and_request_keys(self):
        legacy_path = os.path.join(self.temp_dir.name, "legacy.db")
        with patch("database.DB_PATH", legacy_path):
            conn = self.get_db()
            conn.execute("""CREATE TABLE product_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT, visit_key TEXT UNIQUE NOT NULL,
                visitor_id TEXT NOT NULL, product_id INTEGER NOT NULL, product_name TEXT NOT NULL,
                user_id INTEGER, customer_name TEXT, customer_email TEXT, customer_phone TEXT,
                source TEXT NOT NULL DEFAULT 'guest', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )""")
            keys = [str(uuid.uuid4()) for _ in range(3)]
            for index, key in enumerate(keys):
                conn.execute("""INSERT INTO product_visits
                    (visit_key, visitor_id, product_id, product_name, customer_name, customer_email, source, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (key, self.visit["visitor_id"], self.product["id"], "Legacy Product",
                     "Legacy Guest" if index == 1 else None, "legacy@example.test" if index == 1 else None,
                     "shared" if index == 1 else "guest", f"2020-01-0{index + 1} 00:00:00"))
            for index in range(2):
                conn.execute("""INSERT INTO product_visits
                    (visit_key, visitor_id, product_id, product_name, user_id, customer_name, source)
                    VALUES (?, ?, ?, ?, 42, 'Legacy Account', 'account')""",
                    (str(uuid.uuid4()), str(uuid.uuid4()), self.product["id"], "Legacy Product"))
            conn.commit()
            conn.close()
            self.init_db()
            self.init_db()
            result = self.visitors()
            self.assertEqual(result["total"], 2)
            guest = self.visitors(source="shared")["items"][0]
            self.assertEqual(guest["customer_name"], "Legacy Guest")
            self.assertEqual(guest["visit_count"], 3)
            self.assertEqual(guest["created_at"], "2020-01-01 00:00:00")
            self.assertEqual(guest["last_visited_at"], "2020-01-03 00:00:00")
            self.assertEqual(self.visitors(source="account")["items"][0]["visit_count"], 2)
            retry = {**self.visit, "visit_key": keys[-1]}
            self.assertEqual(self.record(retry).status_code, 200)
            self.assertEqual(self.visitors(source="shared")["items"][0]["visit_count"], 3)
            contact = self.client.put(f"/api/product-visits/{keys[-1]}/contact", json={
                "visitor_id": self.visit["visitor_id"], "name": "Updated Guest", "phone": "9876543210",
            })
            self.assertEqual(contact.status_code, 200)
            self.assertEqual(self.visitors(source="shared")["items"][0]["customer_name"], "Updated Guest")


if __name__ == "__main__":
    unittest.main()
