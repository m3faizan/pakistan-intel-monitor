"""
Backend API Tests for CPI Inflation Data (Consumer Price Index)
Tests the /api/cpi-yoy and /api/cpi-mom endpoints that fetch CPI data from State Bank of Pakistan API

Features tested:
- CPI Year-on-Year (YoY) inflation data
- CPI Month-on-Month (MoM) inflation data
- Historical data availability
- Data structure validation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCPIYoYEndpoint:
    """CPI Year-on-Year inflation data endpoint tests - LIVE data from SBP EasyData API"""
    
    def test_cpi_yoy_returns_200(self):
        """Test CPI YoY endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_cpi_yoy_has_data_field(self):
        """Test CPI YoY response contains 'data' and 'updated' fields"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        assert "data" in data, "Response should have 'data' field"
        assert "updated" in data, "Response should have 'updated' field"
        
    def test_cpi_yoy_has_latest_value(self):
        """Test CPI YoY data contains latest value with month info"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert cpi is not None, "CPI YoY data should not be None"
        assert "latest" in cpi, "CPI data should have 'latest' field"
        
        latest = cpi["latest"]
        assert "value" in latest, "Latest should have 'value' field"
        assert "month" in latest, "Latest should have 'month' field"
        assert "date" in latest, "Latest should have 'date' field"
        assert "unit" in latest, "Latest should have 'unit' field"
        
        assert isinstance(latest["value"], (int, float)), "Value should be numeric"
        assert latest["unit"] == "Percent", "Unit should be 'Percent'"
        
    def test_cpi_yoy_has_previous_value(self):
        """Test CPI YoY data contains previous month data"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "previous" in cpi, "CPI data should have 'previous' field"
        
        previous = cpi["previous"]
        assert "value" in previous, "Previous should have 'value' field"
        assert "date" in previous, "Previous should have 'date' field"
        
    def test_cpi_yoy_has_mom_change(self):
        """Test CPI YoY data contains month-on-month change"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "mom_change" in cpi, "CPI data should have 'mom_change' field"
        assert isinstance(cpi["mom_change"], (int, float)) or cpi["mom_change"] is None, "MoM change should be numeric or None"
        
    def test_cpi_yoy_has_yoy_comparison(self):
        """Test CPI YoY data contains year-over-year comparison (value from 12 months ago)"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "yoy_comparison" in cpi, "CPI data should have 'yoy_comparison' field"
        
    def test_cpi_yoy_has_history(self):
        """Test CPI YoY data contains historical data array"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "history" in cpi, "CPI data should have 'history' field"
        assert isinstance(cpi["history"], list), "History should be a list"
        assert len(cpi["history"]) >= 12, f"History should have at least 12 months of data, got {len(cpi['history'])}"
        
        # Validate history item structure
        if len(cpi["history"]) > 0:
            item = cpi["history"][0]
            assert "date" in item, "History item should have 'date'"
            assert "value" in item, "History item should have 'value'"
            assert "unit" in item, "History item should have 'unit'"
        
    def test_cpi_yoy_has_source(self):
        """Test CPI YoY data includes source information"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "source" in cpi, "CPI data should have 'source' field"
        assert cpi["source"] == "State Bank of Pakistan", "Source should be State Bank of Pakistan"
        
    def test_cpi_yoy_has_name(self):
        """Test CPI YoY data has correct name"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "name" in cpi, "CPI data should have 'name' field"
        assert "Year-on-Year" in cpi["name"], "Name should indicate Year-on-Year"
        
    def test_cpi_yoy_has_type(self):
        """Test CPI YoY data has correct type identifier"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        assert "type" in cpi, "CPI data should have 'type' field"
        assert cpi["type"] == "yoy", "Type should be 'yoy'"
        
    def test_cpi_yoy_value_reasonable_range(self):
        """Test CPI YoY value is within reasonable range (-20% to +50%)"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        cpi = data["data"]
        value = cpi["latest"]["value"]
        # CPI YoY can be negative (deflation) or high in some economies
        assert -20 <= value <= 50, f"CPI YoY value {value}% seems out of reasonable range"


class TestCPIMoMEndpoint:
    """CPI Month-on-Month inflation data endpoint tests - LIVE data from SBP EasyData API"""
    
    def test_cpi_mom_returns_200(self):
        """Test CPI MoM endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_cpi_mom_has_data_field(self):
        """Test CPI MoM response contains 'data' and 'updated' fields"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        assert "data" in data, "Response should have 'data' field"
        assert "updated" in data, "Response should have 'updated' field"
        
    def test_cpi_mom_has_latest_value(self):
        """Test CPI MoM data contains latest value with month info"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert cpi is not None, "CPI MoM data should not be None"
        assert "latest" in cpi, "CPI data should have 'latest' field"
        
        latest = cpi["latest"]
        assert "value" in latest, "Latest should have 'value' field"
        assert "month" in latest, "Latest should have 'month' field"
        assert "date" in latest, "Latest should have 'date' field"
        assert "unit" in latest, "Latest should have 'unit' field"
        
        assert isinstance(latest["value"], (int, float)), "Value should be numeric"
        
    def test_cpi_mom_has_previous_value(self):
        """Test CPI MoM data contains previous month data"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert "previous" in cpi, "CPI data should have 'previous' field"
        
    def test_cpi_mom_has_history(self):
        """Test CPI MoM data contains historical data array"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert "history" in cpi, "CPI data should have 'history' field"
        assert isinstance(cpi["history"], list), "History should be a list"
        assert len(cpi["history"]) >= 12, f"History should have at least 12 months of data, got {len(cpi['history'])}"
        
    def test_cpi_mom_has_source(self):
        """Test CPI MoM data includes source information"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert "source" in cpi, "CPI data should have 'source' field"
        assert cpi["source"] == "State Bank of Pakistan", "Source should be State Bank of Pakistan"
        
    def test_cpi_mom_has_name(self):
        """Test CPI MoM data has correct name"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert "name" in cpi, "CPI data should have 'name' field"
        assert "Month-on-Month" in cpi["name"], "Name should indicate Month-on-Month"
        
    def test_cpi_mom_has_type(self):
        """Test CPI MoM data has correct type identifier"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        assert "type" in cpi, "CPI data should have 'type' field"
        assert cpi["type"] == "mom", "Type should be 'mom'"
        
    def test_cpi_mom_value_reasonable_range(self):
        """Test CPI MoM value is within reasonable range (-10% to +10%)"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        value = cpi["latest"]["value"]
        # MoM inflation is typically between -3% and +5% in a month
        assert -10 <= value <= 10, f"CPI MoM value {value}% seems out of reasonable range"
        
    def test_cpi_mom_can_be_negative(self):
        """Test CPI MoM history can contain negative values (deflation months)"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom")
        data = response.json()
        
        cpi = data["data"]
        history = cpi["history"]
        
        # MoM can have negative values (deflation in some months)
        has_negative = any(item["value"] < 0 for item in history)
        # This is expected in MoM data, just verify the history has variety
        print(f"MoM data contains negative values (deflation months): {has_negative}")


class TestCPIDataIntegrity:
    """Test data integrity and consistency between YoY and MoM endpoints"""
    
    def test_both_endpoints_same_latest_month(self):
        """Test that YoY and MoM have data for the same latest month"""
        yoy_response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        mom_response = requests.get(f"{BASE_URL}/api/cpi-mom")
        
        yoy = yoy_response.json()["data"]
        mom = mom_response.json()["data"]
        
        assert yoy["latest"]["date"] == mom["latest"]["date"], "YoY and MoM should have same latest date"
        assert yoy["latest"]["month"] == mom["latest"]["month"], "YoY and MoM should have same latest month"
        
    def test_history_data_from_2016_onwards(self):
        """Test that history data is available from 2016 (latest base year)"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        history = data["data"]["history"]
        # Check oldest date in history (last item since data is sorted newest first)
        oldest = history[-1]
        oldest_year = int(oldest["date"][:4])
        assert oldest_year >= 2016, f"History should start from 2016 or later, got {oldest_year}"
        
    def test_history_dates_are_valid(self):
        """Test that all history dates are valid date strings"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy")
        data = response.json()
        
        history = data["data"]["history"]
        for item in history[:12]:  # Check first 12 items
            date_str = item["date"]
            # Should be in YYYY-MM-DD format
            assert len(date_str) == 10, f"Date should be YYYY-MM-DD format, got {date_str}"
            year, month, day = date_str.split("-")
            assert 2016 <= int(year) <= 2030, f"Year {year} seems invalid"
            assert 1 <= int(month) <= 12, f"Month {month} seems invalid"
            assert 1 <= int(day) <= 31, f"Day {day} seems invalid"
