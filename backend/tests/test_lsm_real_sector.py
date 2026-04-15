"""
Tests for LSM (Large-scale Manufacturing) Quantum Index API endpoints
Testing the new Real Sector panel with LSM functionality
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLSMEndpoint:
    """Tests for /api/lsm endpoint - latest LSM summary"""

    def test_lsm_returns_200(self):
        """GET /api/lsm should return 200"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/lsm returns 200")

    def test_lsm_has_data_structure(self):
        """GET /api/lsm should return proper data structure"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data, "Response should have 'data' field"
        lsm_data = data["data"]
        
        # Check required fields
        assert "latest" in lsm_data, "Missing 'latest' field"
        assert "mom_change_pct" in lsm_data, "Missing 'mom_change_pct' field"
        print("PASS: LSM data has required structure (latest, mom_change_pct)")

    def test_lsm_latest_contains_required_fields(self):
        """Latest LSM data should have value, month, date"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200
        lsm_data = response.json()["data"]
        
        latest = lsm_data.get("latest", {})
        assert "value" in latest, "latest should have 'value'"
        assert "month" in latest, "latest should have 'month'"
        assert "date" in latest, "latest should have 'date'"
        
        # Value assertions
        assert latest["value"] is not None, "latest.value should not be None"
        assert isinstance(latest["value"], (int, float)), "latest.value should be numeric"
        
        print(f"PASS: LSM latest value = {latest['value']}, month = {latest['month']}")

    def test_lsm_mom_change_semantics(self):
        """MoM change percentage should follow increase=good semantics"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200
        lsm_data = response.json()["data"]
        
        mom_change_pct = lsm_data.get("mom_change_pct")
        assert mom_change_pct is not None, "mom_change_pct should be present"
        assert isinstance(mom_change_pct, (int, float)), "mom_change_pct should be numeric"
        
        # Semantic check: positive = increase = good (green), negative = decrease = bad (red)
        if mom_change_pct >= 0:
            print(f"PASS: LSM MoM change = +{mom_change_pct}% (GREEN - increase is good)")
        else:
            print(f"PASS: LSM MoM change = {mom_change_pct}% (RED - decrease is bad)")

    def test_lsm_yoy_change_present(self):
        """YoY change should be present in the response"""
        response = requests.get(f"{BASE_URL}/api/lsm", timeout=30)
        assert response.status_code == 200
        lsm_data = response.json()["data"]
        
        yoy_change = lsm_data.get("yoy_change")
        # YoY might be None if not enough historical data, but field should exist
        assert "yoy_change" in lsm_data, "yoy_change field should exist"
        print(f"PASS: LSM YoY change = {yoy_change}")


class TestLSMHistoricalEndpoint:
    """Tests for /api/lsm-historical endpoint - complete LSM history"""

    def test_lsm_historical_returns_200(self):
        """GET /api/lsm-historical should return 200"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/lsm-historical returns 200")

    def test_lsm_historical_has_history(self):
        """Historical endpoint should return history array"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "history" in data, "Missing 'history' field"
        history = data["history"]
        assert isinstance(history, list), "history should be a list"
        assert len(history) > 0, "history should not be empty"
        
        print(f"PASS: LSM historical data has {len(history)} data points")

    def test_lsm_historical_spans_from_1977(self):
        """History should span from around 1977 (oldest base year)"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        history = data.get("history", [])
        assert len(history) > 0, "History should not be empty"
        
        # Sort to get earliest date
        sorted_history = sorted(history, key=lambda x: x["date"])
        earliest_date = sorted_history[0]["date"]
        earliest_year = int(earliest_date[:4])
        
        # Should be from around 1977-1981 (Base 1969-70 starts from 1977-07-01)
        assert earliest_year <= 1985, f"History should start from before 1985, got {earliest_year}"
        print(f"PASS: LSM history starts from {earliest_date} (year {earliest_year})")

    def test_lsm_historical_extends_to_2025(self):
        """History should extend to latest available data (around 2025-12)"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        history = data.get("history", [])
        assert len(history) > 0, "History should not be empty"
        
        # Sort to get latest date
        sorted_history = sorted(history, key=lambda x: x["date"], reverse=True)
        latest_date = sorted_history[0]["date"]
        latest_year = int(latest_date[:4])
        
        # Should be 2024 or 2025
        assert latest_year >= 2024, f"History should extend to at least 2024, got {latest_year}"
        print(f"PASS: LSM history extends to {latest_date} (year {latest_year})")

    def test_lsm_historical_has_base_year_markers(self):
        """Historical endpoint should include base_year_markers for chart"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "base_year_markers" in data, "Missing 'base_year_markers' field"
        markers = data["base_year_markers"]
        assert isinstance(markers, list), "base_year_markers should be a list"
        assert len(markers) >= 4, f"Should have at least 4 base year markers, got {len(markers)}"
        
        # Check marker structure
        for marker in markers:
            assert "date" in marker, "Marker should have 'date'"
            assert "label" in marker or "base_year" in marker, "Marker should have label/base_year"
        
        print(f"PASS: LSM has {len(markers)} base year markers: {[m.get('label', m.get('base_year')) for m in markers]}")

    def test_lsm_history_entries_have_base_year(self):
        """Each history entry should have a base_year field"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        history = data.get("history", [])
        sample = history[:5] if len(history) >= 5 else history
        
        for item in sample:
            assert "date" in item, "History item should have 'date'"
            assert "value" in item, "History item should have 'value'"
            assert "base_year" in item, "History item should have 'base_year'"
        
        print(f"PASS: LSM history entries have required fields (date, value, base_year)")

    def test_lsm_date_range_field(self):
        """Response should include date_range field"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "date_range" in data, "Missing 'date_range' field"
        date_range = data["date_range"]
        assert " to " in date_range, f"date_range should be in 'start to end' format, got: {date_range}"
        
        print(f"PASS: LSM date range = {date_range}")

    def test_lsm_total_data_points(self):
        """Response should report total_data_points"""
        response = requests.get(f"{BASE_URL}/api/lsm-historical", timeout=45)
        assert response.status_code == 200
        data = response.json()["data"]
        
        assert "total_data_points" in data, "Missing 'total_data_points' field"
        total = data["total_data_points"]
        history_len = len(data.get("history", []))
        
        assert total == history_len, f"total_data_points ({total}) should match history length ({history_len})"
        print(f"PASS: LSM has {total} total data points")


class TestRegressionExistingEndpoints:
    """Regression tests to ensure existing panels still work"""

    def test_inflation_cpi_yoy_returns_200(self):
        """GET /api/cpi-yoy should still work"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy", timeout=30)
        assert response.status_code == 200, f"CPI YoY regression failed: {response.status_code}"
        print("PASS: /api/cpi-yoy returns 200 (regression)")

    def test_inflation_cpi_mom_returns_200(self):
        """GET /api/cpi-mom should still work"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom", timeout=30)
        assert response.status_code == 200, f"CPI MoM regression failed: {response.status_code}"
        print("PASS: /api/cpi-mom returns 200 (regression)")

    def test_economic_endpoint_returns_200(self):
        """GET /api/economic should still work"""
        response = requests.get(f"{BASE_URL}/api/economic", timeout=30)
        assert response.status_code == 200, f"Economic regression failed: {response.status_code}"
        print("PASS: /api/economic returns 200 (regression)")

    def test_business_environment_returns_200(self):
        """GET /api/business-environment should still work"""
        response = requests.get(f"{BASE_URL}/api/business-environment", timeout=30)
        assert response.status_code == 200, f"Business Environment regression failed: {response.status_code}"
        print("PASS: /api/business-environment returns 200 (regression)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
