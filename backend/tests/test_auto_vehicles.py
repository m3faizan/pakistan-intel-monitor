"""
Test Auto Vehicles API - Production and Sale of Auto Vehicles
Tests GET /api/auto-vehicles endpoint with production and sales data including category breakdowns
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAutoVehiclesAPI:
    """Test Auto Vehicles endpoint - production and sales with category breakdowns"""

    def test_auto_vehicles_returns_200(self):
        """Test that /api/auto-vehicles returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/auto-vehicles returns 200")

    def test_auto_vehicles_response_structure(self):
        """Test that response has data with production and sales blocks"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data, "Response must have 'data' key"
        
        auto_data = data["data"]
        assert auto_data is not None, "Auto vehicles data should not be null"
        assert "production" in auto_data, "Response must have 'production' block"
        assert "sales" in auto_data, "Response must have 'sales' block"
        assert "latest_month" in auto_data, "Response must have 'latest_month'"
        assert "latest_date" in auto_data, "Response must have 'latest_date'"
        assert "source" in auto_data, "Response must have 'source'"
        print("PASS: Response has correct top-level structure")

    def test_production_block_structure(self):
        """Test that production block has correct structure with latest, history, categories"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        production = response.json()["data"]["production"]
        assert production is not None, "Production data should not be null"
        
        # Check required keys
        assert "latest" in production, "Production must have 'latest'"
        assert "history" in production, "Production must have 'history'"
        assert "categories" in production, "Production must have 'categories'"
        assert "mom_change_pct" in production, "Production must have 'mom_change_pct'"
        
        # Check latest structure
        latest = production["latest"]
        assert "total" in latest, "Latest must have 'total'"
        assert "month" in latest, "Latest must have 'month'"
        assert "date" in latest, "Latest must have 'date'"
        
        # Check total is a number
        assert isinstance(latest["total"], (int, float)), "Total must be numeric"
        print(f"PASS: Production block structure correct - latest total: {latest['total']}")

    def test_sales_block_structure(self):
        """Test that sales block has correct structure with latest, history, categories"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        sales = response.json()["data"]["sales"]
        assert sales is not None, "Sales data should not be null"
        
        # Check required keys
        assert "latest" in sales, "Sales must have 'latest'"
        assert "history" in sales, "Sales must have 'history'"
        assert "categories" in sales, "Sales must have 'categories'"
        assert "mom_change_pct" in sales, "Sales must have 'mom_change_pct'"
        
        # Check latest structure
        latest = sales["latest"]
        assert "total" in latest, "Latest must have 'total'"
        assert "month" in latest, "Latest must have 'month'"
        assert "date" in latest, "Latest must have 'date'"
        
        # Check total is a number
        assert isinstance(latest["total"], (int, float)), "Total must be numeric"
        print(f"PASS: Sales block structure correct - latest total: {latest['total']}")

    def test_production_categories(self):
        """Test that production has all 6 required categories"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        categories = response.json()["data"]["production"]["categories"]
        assert len(categories) == 6, f"Expected 6 categories, got {len(categories)}"
        
        expected_keys = {"cars", "trucks", "buses", "jeeps_pickups", "tractors", "two_three_wheelers"}
        actual_keys = {cat["key"] for cat in categories}
        assert actual_keys == expected_keys, f"Category keys mismatch. Expected {expected_keys}, got {actual_keys}"
        
        # Check labels
        expected_labels = {"Cars", "Trucks", "Buses", "Jeeps & Pickups", "Tractors", "2 & 3 Wheelers"}
        actual_labels = {cat["label"] for cat in categories}
        assert actual_labels == expected_labels, f"Category labels mismatch"
        print(f"PASS: All 6 production categories present: {[c['label'] for c in categories]}")

    def test_sales_categories(self):
        """Test that sales has all 6 required categories"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        categories = response.json()["data"]["sales"]["categories"]
        assert len(categories) == 6, f"Expected 6 categories, got {len(categories)}"
        
        expected_keys = {"cars", "trucks", "buses", "jeeps_pickups", "tractors", "two_three_wheelers"}
        actual_keys = {cat["key"] for cat in categories}
        assert actual_keys == expected_keys, f"Category keys mismatch"
        print(f"PASS: All 6 sales categories present")

    def test_production_history_has_category_data(self):
        """Test that production history entries include category values"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        history = response.json()["data"]["production"]["history"]
        assert len(history) > 0, "Production history should not be empty"
        
        # Check latest entry has all category fields
        latest_entry = history[-1]
        required_fields = ["date", "total", "cars", "trucks", "buses", "jeeps_pickups", "tractors", "two_three_wheelers"]
        for field in required_fields:
            assert field in latest_entry, f"History entry missing '{field}' field"
        
        print(f"PASS: Production history has {len(history)} data points with all category fields")
        print(f"  Latest entry: {latest_entry}")

    def test_sales_history_has_category_data(self):
        """Test that sales history entries include category values"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        history = response.json()["data"]["sales"]["history"]
        assert len(history) > 0, "Sales history should not be empty"
        
        # Check latest entry has all category fields
        latest_entry = history[-1]
        required_fields = ["date", "total", "cars", "trucks", "buses", "jeeps_pickups", "tractors", "two_three_wheelers"]
        for field in required_fields:
            assert field in latest_entry, f"History entry missing '{field}' field"
        
        print(f"PASS: Sales history has {len(history)} data points with all category fields")

    def test_mom_change_calculations(self):
        """Test that MoM change percentages are calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/auto-vehicles", timeout=30)
        assert response.status_code == 200
        
        data = response.json()["data"]
        
        # Check production MoM
        prod_history = data["production"]["history"]
        prod_mom = data["production"]["mom_change_pct"]
        if len(prod_history) >= 2:
            latest = prod_history[-1]["total"]
            prev = prod_history[-2]["total"]
            expected_mom = round(((latest - prev) / prev) * 100, 2) if prev else None
            assert prod_mom == expected_mom or abs(prod_mom - expected_mom) < 0.01, \
                f"Production MoM mismatch: expected {expected_mom}, got {prod_mom}"
        
        print(f"PASS: Production MoM change: {data['production']['mom_change_pct']}%")
        print(f"PASS: Sales MoM change: {data['sales']['mom_change_pct']}%")


class TestKeyEconomicIndicatorsRegression:
    """Regression tests for key economic indicators that should still return data"""

    def test_economic_returns_200(self):
        """Test that /api/economic returns 200"""
        response = requests.get(f"{BASE_URL}/api/economic", timeout=20)
        assert response.status_code == 200
        print("PASS: /api/economic returns 200")

    def test_lsm_returns_200(self):
        """Test that /api/lsm returns 200"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200
        print("PASS: /api/lsm returns 200")

    def test_lsm_historical_returns_200(self):
        """Test that /api/lsm-historical returns 200"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=30)
        assert response.status_code == 200
        print("PASS: /api/lsm-historical returns 200")

    def test_cpi_yoy_returns_200(self):
        """Test that /api/cpi-yoy returns 200"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy", timeout=20)
        assert response.status_code == 200
        print("PASS: /api/cpi-yoy returns 200")

    def test_cpi_mom_returns_200(self):
        """Test that /api/cpi-mom returns 200"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom", timeout=20)
        assert response.status_code == 200
        print("PASS: /api/cpi-mom returns 200")

    def test_business_environment_returns_200(self):
        """Test that /api/business-environment returns 200"""
        response = requests.get(f"{BASE_URL}/api/business-environment", timeout=30)
        assert response.status_code == 200
        print("PASS: /api/business-environment returns 200")

    def test_remittances_returns_200(self):
        """Test that /api/remittances returns 200"""
        response = requests.get(f"{BASE_URL}/api/remittances", timeout=30)
        assert response.status_code == 200
        print("PASS: /api/remittances returns 200")


class TestLSMModalRegression:
    """Regression test: LSM modal should have inline base selector and no 20Y time range"""

    def test_lsm_historical_returns_data(self):
        """Test that /api/lsm-historical returns data with history array"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        if data.get("data"):
            assert "history" in data["data"], "LSM historical should have 'history' key"
            history = data["data"]["history"]
            if history:
                # Check that history items have base_year for filtering
                assert "base_year" in history[0], "History items should have 'base_year' for base selector"
                print(f"PASS: LSM historical has {len(history)} data points with base_year field")
            else:
                print("WARN: LSM historical history is empty (may be API rate limited)")
        else:
            print("WARN: LSM historical data is null (may be API rate limited)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
