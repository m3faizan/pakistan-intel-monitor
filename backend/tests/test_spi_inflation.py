"""
SPI (Sensitive Price Index) API Tests
Tests for weekly and monthly SPI data endpoints
Data sourced from Google Sheet (PakESDA SPI Dashboard)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSPIWeeklyAPI:
    """Tests for GET /api/spi-weekly endpoint (Weekly Combined SPI from Google Sheet)"""

    def test_spi_weekly_returns_200(self):
        """Test that SPI weekly endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/spi-weekly returns 200 status")

    def test_spi_weekly_has_data_structure(self):
        """Test that SPI weekly response has required data structure"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "data" in data, "Response should have 'data' field"
        assert "updated" in data, "Response should have 'updated' field"
        
        spi_data = data["data"]
        assert spi_data is not None, "Data should not be None"
        
        # Check required fields
        required_fields = ["latest", "previous", "history", "source", "name", "frequency"]
        for field in required_fields:
            assert field in spi_data, f"SPI weekly data should have '{field}' field"
        
        print("PASS: SPI weekly response has correct data structure")

    def test_spi_weekly_latest_value(self):
        """Test that SPI weekly latest value is present and valid"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        data = response.json()["data"]
        
        latest = data.get("latest", {})
        assert "value" in latest, "Latest should have 'value'"
        assert "date" in latest, "Latest should have 'date'"
        assert "week" in latest, "Latest should have 'week'"
        assert "week_ending_formatted" in latest, "Latest should have 'week_ending_formatted'"
        
        # Value should be a positive number (index value)
        assert isinstance(latest["value"], (int, float)), "Value should be numeric"
        assert latest["value"] > 0, "SPI value should be positive"
        
        print(f"PASS: SPI weekly latest value: {latest['value']} (Week: {latest['week']}, Date: {latest['week_ending_formatted']})")

    def test_spi_weekly_change_metrics(self):
        """Test that SPI weekly has change metrics (WoW)"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        data = response.json()["data"]
        
        # Check change fields exist
        assert "primary_change" in data, "Should have 'primary_change'"
        assert "primary_change_pct" in data, "Should have 'primary_change_pct'"
        assert "primary_change_label" in data, "Should have 'primary_change_label'"
        assert data["primary_change_label"] == "WoW", f"Change label should be 'WoW', got {data['primary_change_label']}"
        
        print(f"PASS: SPI weekly WoW change: {data['primary_change']} pts ({data['primary_change_pct']}%)")

    def test_spi_weekly_history_not_empty(self):
        """Test that SPI weekly has non-empty history"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        data = response.json()["data"]
        
        history = data.get("history", [])
        assert len(history) > 0, "History should not be empty"
        assert len(history) >= 50, f"Should have substantial history, got {len(history)} points"
        
        # Check first history item has required fields
        first_item = history[0]
        assert "date" in first_item, "History item should have 'date'"
        assert "value" in first_item, "History item should have 'value'"
        assert "pct_change" in first_item, "History item should have 'pct_change'"
        
        print(f"PASS: SPI weekly history has {len(history)} data points")

    def test_spi_weekly_source_is_correct(self):
        """Test that SPI weekly source is PakESDA Google Sheet"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        data = response.json()["data"]
        
        assert "PakESDA" in data.get("source", "") or "Google Sheet" in data.get("source", ""), \
            f"Source should mention PakESDA or Google Sheet, got: {data.get('source')}"
        assert data.get("frequency") == "Weekly", f"Frequency should be 'Weekly', got: {data.get('frequency')}"
        
        print(f"PASS: SPI weekly source: {data['source']}, Frequency: {data['frequency']}")


class TestSPIMonthlyAPI:
    """Tests for GET /api/spi-monthly endpoint (Monthly SPI from Google Sheet)"""

    def test_spi_monthly_returns_200(self):
        """Test that SPI monthly endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/spi-monthly returns 200 status")

    def test_spi_monthly_has_data_structure(self):
        """Test that SPI monthly response has required data structure"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level structure
        assert "data" in data, "Response should have 'data' field"
        assert "updated" in data, "Response should have 'updated' field"
        
        spi_data = data["data"]
        assert spi_data is not None, "Data should not be None"
        
        # Check required fields
        required_fields = ["latest", "previous", "history", "source", "name", "frequency"]
        for field in required_fields:
            assert field in spi_data, f"SPI monthly data should have '{field}' field"
        
        print("PASS: SPI monthly response has correct data structure")

    def test_spi_monthly_latest_value(self):
        """Test that SPI monthly latest value is present and valid"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        data = response.json()["data"]
        
        latest = data.get("latest", {})
        assert "value" in latest, "Latest should have 'value'"
        assert "date" in latest, "Latest should have 'date'"
        assert "month" in latest, "Latest should have 'month'"
        
        # Value should be a positive number (index value)
        assert isinstance(latest["value"], (int, float)), "Value should be numeric"
        assert latest["value"] > 0, "SPI value should be positive"
        
        print(f"PASS: SPI monthly latest value: {latest['value']} ({latest['month']})")

    def test_spi_monthly_change_metrics(self):
        """Test that SPI monthly has change metrics (MoM)"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        data = response.json()["data"]
        
        # Check change fields exist
        assert "primary_change" in data, "Should have 'primary_change'"
        assert "primary_change_pct" in data, "Should have 'primary_change_pct'"
        assert "primary_change_label" in data, "Should have 'primary_change_label'"
        assert data["primary_change_label"] == "MoM", f"Change label should be 'MoM', got {data['primary_change_label']}"
        
        print(f"PASS: SPI monthly MoM change: {data['primary_change']} pts ({data['primary_change_pct']}%)")

    def test_spi_monthly_history_not_empty(self):
        """Test that SPI monthly has non-empty history"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        data = response.json()["data"]
        
        history = data.get("history", [])
        assert len(history) > 0, "History should not be empty"
        assert len(history) >= 12, f"Should have at least 12 months of history, got {len(history)} points"
        
        # Check first history item has required fields
        first_item = history[0]
        assert "date" in first_item, "History item should have 'date'"
        assert "value" in first_item, "History item should have 'value'"
        assert "month" in first_item, "History item should have 'month'"
        assert "pct_change" in first_item, "History item should have 'pct_change'"
        
        print(f"PASS: SPI monthly history has {len(history)} data points")

    def test_spi_monthly_source_is_correct(self):
        """Test that SPI monthly source is PakESDA Google Sheet"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        data = response.json()["data"]
        
        assert "PakESDA" in data.get("source", "") or "Google Sheet" in data.get("source", ""), \
            f"Source should mention PakESDA or Google Sheet, got: {data.get('source')}"
        assert data.get("frequency") == "Monthly", f"Frequency should be 'Monthly', got: {data.get('frequency')}"
        
        print(f"PASS: SPI monthly source: {data['source']}, Frequency: {data['frequency']}")


class TestCPIAPIsNotBroken:
    """Regression tests to ensure existing CPI endpoints are not broken"""

    def test_cpi_yoy_still_works(self):
        """Test that CPI YoY endpoint still returns data"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy", timeout=30)
        assert response.status_code == 200, f"CPI YoY should return 200, got {response.status_code}"
        data = response.json()
        assert "data" in data, "CPI YoY should return data"
        assert data["data"] is not None, "CPI YoY data should not be None"
        print("PASS: CPI YoY endpoint still working")

    def test_cpi_mom_still_works(self):
        """Test that CPI MoM endpoint still returns data"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom", timeout=30)
        assert response.status_code == 200, f"CPI MoM should return 200, got {response.status_code}"
        data = response.json()
        assert "data" in data, "CPI MoM should return data"
        assert data["data"] is not None, "CPI MoM data should not be None"
        print("PASS: CPI MoM endpoint still working")

    def test_cpi_yoy_historical_still_works(self):
        """Test that CPI YoY historical endpoint still returns data"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical", timeout=30)
        assert response.status_code == 200, f"CPI YoY historical should return 200, got {response.status_code}"
        data = response.json()
        assert "data" in data, "CPI YoY historical should return data"
        print("PASS: CPI YoY historical endpoint still working")

    def test_cpi_mom_historical_still_works(self):
        """Test that CPI MoM historical endpoint still returns data"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical", timeout=30)
        assert response.status_code == 200, f"CPI MoM historical should return 200, got {response.status_code}"
        data = response.json()
        assert "data" in data, "CPI MoM historical should return data"
        print("PASS: CPI MoM historical endpoint still working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
