"""
Backend API Tests for PSX (Pakistan Stock Exchange) KSE-100 Data
Tests the /api/psx-data endpoint that fetches live PSX data by scraping dps.psx.com.pk
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPSXDataEndpoint:
    """PSX KSE-100 data endpoint tests - LIVE data from Pakistan Stock Exchange"""
    
    def test_psx_data_returns_200(self):
        """Test PSX data endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        assert response.status_code == 200
        
    def test_psx_data_has_data_field(self):
        """Test PSX response contains 'data' field"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        assert "data" in data
        assert "updated" in data
        
    def test_psx_data_has_value(self):
        """Test PSX data contains KSE-100 index value"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert psx is not None, "PSX data should not be None"
        assert "value" in psx, "PSX data should have 'value' field"
        assert isinstance(psx["value"], (int, float)), "Value should be numeric"
        assert psx["value"] > 0, "KSE-100 value should be positive"
        
    def test_psx_data_has_change(self):
        """Test PSX data contains change value"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "change" in psx, "PSX data should have 'change' field"
        assert isinstance(psx["change"], (int, float)), "Change should be numeric"
        
    def test_psx_data_has_change_percent(self):
        """Test PSX data contains percentage change"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "change_percent" in psx, "PSX data should have 'change_percent' field"
        assert isinstance(psx["change_percent"], (int, float)), "Change percent should be numeric"
        
    def test_psx_data_has_high(self):
        """Test PSX data contains day high value"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "high" in psx, "PSX data should have 'high' field (Day High)"
        if psx["high"] is not None:
            assert isinstance(psx["high"], (int, float)), "High should be numeric"
            assert psx["high"] > 0, "Day High should be positive"
            
    def test_psx_data_has_low(self):
        """Test PSX data contains day low value"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "low" in psx, "PSX data should have 'low' field (Day Low)"
        if psx["low"] is not None:
            assert isinstance(psx["low"], (int, float)), "Low should be numeric"
            assert psx["low"] > 0, "Day Low should be positive"
            
    def test_psx_data_has_volume(self):
        """Test PSX data contains trading volume"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "volume" in psx, "PSX data should have 'volume' field"
        if psx["volume"] is not None:
            assert isinstance(psx["volume"], (int, float)), "Volume should be numeric"
            
    def test_psx_data_has_previous_close(self):
        """Test PSX data contains previous close value"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "previous_close" in psx, "PSX data should have 'previous_close' field"
        if psx["previous_close"] is not None:
            assert isinstance(psx["previous_close"], (int, float)), "Previous close should be numeric"
            assert psx["previous_close"] > 0, "Previous close should be positive"
            
    def test_psx_data_has_yoy_change(self):
        """Test PSX data contains 1-Year change"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "yoy_change" in psx, "PSX data should have 'yoy_change' field (1-Year Change)"
        if psx["yoy_change"] is not None:
            assert isinstance(psx["yoy_change"], (int, float)), "YoY change should be numeric"
            
    def test_psx_data_has_ytd_change(self):
        """Test PSX data contains YTD change"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "ytd_change" in psx, "PSX data should have 'ytd_change' field (YTD Change)"
        if psx["ytd_change"] is not None:
            assert isinstance(psx["ytd_change"], (int, float)), "YTD change should be numeric"
            
    def test_psx_data_has_source(self):
        """Test PSX data includes source information"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "source" in psx, "PSX data should have 'source' field"
        assert psx["source"] == "Pakistan Stock Exchange", "Source should be Pakistan Stock Exchange"
        
    def test_psx_data_has_timestamp(self):
        """Test PSX data includes timestamp"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        assert "timestamp" in psx, "PSX data should have 'timestamp' field"
        
    def test_psx_data_high_greater_than_low(self):
        """Test that Day High is greater than or equal to Day Low"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        if psx["high"] is not None and psx["low"] is not None:
            assert psx["high"] >= psx["low"], "Day High should be >= Day Low"
            
    def test_psx_data_value_within_range(self):
        """Test that KSE-100 value is within reasonable range (10,000 - 500,000)"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        # KSE-100 typically ranges between 10,000 and 500,000
        assert 10000 <= psx["value"] <= 500000, f"KSE-100 value {psx['value']} seems out of expected range"
        
    def test_psx_data_change_percent_reasonable(self):
        """Test that daily change percent is within reasonable bounds (-15% to +15%)"""
        response = requests.get(f"{BASE_URL}/api/psx-data")
        data = response.json()
        
        psx = data["data"]
        # Daily circuit breaker limits are typically around 5-7.5%
        assert -15 <= psx["change_percent"] <= 15, f"Daily change {psx['change_percent']}% seems extreme"
