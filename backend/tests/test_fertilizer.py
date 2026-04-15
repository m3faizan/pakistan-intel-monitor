"""
Test Fertilizer API - TS_GP_RLS_SALEFERT_M dataset
Tests GET /api/fertilizer endpoint for data structure, categories, and history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFertilizerAPI:
    """Tests for the Fertilizer Sales/Offtake API endpoint"""

    def test_fertilizer_endpoint_returns_200(self):
        """Verify /api/fertilizer returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/fertilizer returns 200")

    def test_fertilizer_returns_data_structure(self):
        """Verify response contains data with expected top-level keys"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()
        
        assert "data" in data, "Missing 'data' in response"
        fertilizer_data = data["data"]
        
        # Verify required top-level keys
        required_keys = ["latest", "mom_change_pct", "categories", "history"]
        for key in required_keys:
            assert key in fertilizer_data, f"Missing '{key}' in fertilizer data"
        
        print(f"PASS: Response contains required keys: {required_keys}")

    def test_fertilizer_latest_has_correct_fields(self):
        """Verify latest object contains total, urea, dap, month, date, unit"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()["data"]
        latest = data.get("latest", {})
        
        required_latest_keys = ["total", "urea", "dap", "month", "date", "unit"]
        for key in required_latest_keys:
            assert key in latest, f"Missing '{key}' in latest data"
        
        # Verify values are numeric
        assert isinstance(latest["total"], (int, float)), "total should be numeric"
        assert isinstance(latest["urea"], (int, float)), "urea should be numeric"
        assert isinstance(latest["dap"], (int, float)), "dap should be numeric"
        
        print(f"PASS: Latest data has correct structure - total: {latest['total']}, month: {latest['month']}")

    def test_fertilizer_mom_change_exists(self):
        """Verify mom_change_pct is returned and is a number or null"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()["data"]
        
        mom_change = data.get("mom_change_pct")
        assert mom_change is None or isinstance(mom_change, (int, float)), "mom_change_pct should be numeric or null"
        
        print(f"PASS: mom_change_pct = {mom_change}")

    def test_fertilizer_categories_contains_urea_and_dap(self):
        """Verify categories contains Urea and DAP entries"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()["data"]
        categories = data.get("categories", [])
        
        assert len(categories) >= 2, "Expected at least 2 categories"
        
        category_keys = [c.get("key") for c in categories]
        assert "urea" in category_keys, "Missing 'urea' category"
        assert "dap" in category_keys, "Missing 'dap' category"
        
        print(f"PASS: Categories contain urea and dap: {categories}")

    def test_fertilizer_history_has_data_points(self):
        """Verify history contains data points with date, total, urea, dap"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()["data"]
        history = data.get("history", [])
        
        assert len(history) > 0, "History should not be empty"
        
        # Check first and last items have required fields
        for item in [history[0], history[-1]]:
            assert "date" in item, "Missing 'date' in history item"
            assert "total" in item, "Missing 'total' in history item"
            assert "urea" in item, "Missing 'urea' in history item"
            assert "dap" in item, "Missing 'dap' in history item"
        
        print(f"PASS: History contains {len(history)} data points with urea/dap/total")

    def test_fertilizer_history_ordered_chronologically(self):
        """Verify history is ordered from oldest to newest (for chart rendering)"""
        response = requests.get(f"{BASE_URL}/api/fertilizer", timeout=30)
        data = response.json()["data"]
        history = data.get("history", [])
        
        if len(history) > 1:
            dates = [item["date"] for item in history]
            assert dates == sorted(dates), "History should be sorted chronologically (oldest to newest)"
        
        print(f"PASS: History is chronologically sorted")


class TestAutoVehiclesRegression:
    """Regression tests for Auto Vehicles to ensure it still works"""

    def test_auto_vehicles_endpoint_returns_200(self):
        """Verify /api/auto-vehicles returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/auto-vehicles returns 200 (regression)")

    def test_auto_vehicles_has_production_and_sales(self):
        """Verify auto-vehicles returns production and sales data"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        data = response.json()["data"]
        
        assert "production" in data, "Missing 'production' in auto-vehicles data"
        assert "sales" in data, "Missing 'sales' in auto-vehicles data"
        
        prod_total = data["production"].get("latest", {}).get("total")
        sales_total = data["sales"].get("latest", {}).get("total")
        
        assert prod_total is not None, "production.latest.total should exist"
        assert sales_total is not None, "sales.latest.total should exist"
        
        print(f"PASS: Auto Vehicles - Production: {prod_total}, Sales: {sales_total} (regression)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
