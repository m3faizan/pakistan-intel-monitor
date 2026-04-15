"""
Test suite for CPI Historical Data APIs - Testing historical data spanning 60+ years
Verifies: Combined historical data from 8 base year periods (1964-2026)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCPIYoYHistorical:
    """Tests for GET /api/cpi-yoy-historical endpoint"""
    
    def test_endpoint_returns_200(self):
        """API should return 200 status"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PASS: /api/cpi-yoy-historical returns 200")
    
    def test_returns_656_plus_data_points(self):
        """API should return 656+ data points spanning 1965-2026"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        total_points = data.get('total_data_points', 0)
        
        assert total_points >= 656, f"Expected 656+ data points, got {total_points}"
        print(f"PASS: Returns {total_points} data points (>= 656)")
    
    def test_date_range_covers_60_years(self):
        """Data range should cover approximately 60 years (1965-2026)"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        date_range = data.get('date_range', '')
        
        assert '1965' in date_range, f"Expected data from 1965, got: {date_range}"
        assert '2026' in date_range, f"Expected data through 2026, got: {date_range}"
        print(f"PASS: Date range: {date_range}")
    
    def test_returns_8_base_year_markers(self):
        """API should return 8 base year period markers"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        markers = data.get('base_year_markers', [])
        
        assert len(markers) == 8, f"Expected 8 base year markers, got {len(markers)}"
        print(f"PASS: Returns 8 base year markers")
    
    def test_base_year_markers_structure(self):
        """Each base year marker should have date, label, and base_year fields"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        markers = data.get('base_year_markers', [])
        
        expected_base_years = ['1959-60', '1969-70', '1975-76', '1980-81', '1990-91', '2000-01', '2007-08', '2015-16']
        actual_base_years = [m.get('base_year') for m in markers]
        
        for expected in expected_base_years:
            assert expected in actual_base_years, f"Missing base year: {expected}"
        
        # Verify marker structure
        for marker in markers:
            assert 'date' in marker, "Marker missing 'date' field"
            assert 'label' in marker, "Marker missing 'label' field"
            assert 'base_year' in marker, "Marker missing 'base_year' field"
        
        print(f"PASS: All 8 base year periods present with correct structure")
    
    def test_history_includes_base_year_per_datapoint(self):
        """Each data point in history should include base_year"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        history = data.get('history', [])
        
        # Check first 10 and last 10 data points
        sample_points = history[:10] + history[-10:] if len(history) > 20 else history
        
        for point in sample_points:
            assert 'date' in point, "Data point missing 'date'"
            assert 'value' in point, "Data point missing 'value'"
            assert 'base_year' in point, "Data point missing 'base_year'"
        
        print(f"PASS: History data points include base_year field")
    
    def test_latest_value_present(self):
        """API should include latest CPI value in response"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        latest = data.get('latest', {})
        
        assert 'value' in latest, "Latest missing 'value'"
        assert 'month' in latest, "Latest missing 'month'"
        assert 'date' in latest, "Latest missing 'date'"
        assert latest.get('value') is not None, "Latest value is None"
        
        print(f"PASS: Latest value: {latest.get('value')}% for {latest.get('month')}")


class TestCPIMoMHistorical:
    """Tests for GET /api/cpi-mom-historical endpoint"""
    
    def test_endpoint_returns_200(self):
        """API should return 200 status"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PASS: /api/cpi-mom-historical returns 200")
    
    def test_returns_significant_data_points(self):
        """API should return significant number of data points"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical")
        data = response.json().get('data', {})
        total_points = data.get('total_data_points', 0)
        
        # MoM historical data should also have 700+ points
        assert total_points >= 650, f"Expected 650+ data points, got {total_points}"
        print(f"PASS: Returns {total_points} data points")
    
    def test_returns_8_base_year_markers(self):
        """MoM API should also return 8 base year markers"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical")
        data = response.json().get('data', {})
        markers = data.get('base_year_markers', [])
        
        assert len(markers) == 8, f"Expected 8 markers, got {len(markers)}"
        print(f"PASS: MoM returns 8 base year markers")


class TestAPIResponseStructure:
    """Tests for API response structure consistency"""
    
    def test_yoy_source_is_sbp(self):
        """Source should be State Bank of Pakistan"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        source = data.get('source', '')
        
        assert 'State Bank of Pakistan' in source, f"Unexpected source: {source}"
        print(f"PASS: Source: {source}")
    
    def test_yoy_type_is_correct(self):
        """Type field should be 'yoy'"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        cpi_type = data.get('type', '')
        
        assert cpi_type == 'yoy', f"Expected type 'yoy', got '{cpi_type}'"
        print(f"PASS: Type is 'yoy'")
    
    def test_mom_type_is_correct(self):
        """Type field should be 'mom'"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical")
        data = response.json().get('data', {})
        cpi_type = data.get('type', '')
        
        assert cpi_type == 'mom', f"Expected type 'mom', got '{cpi_type}'"
        print(f"PASS: Type is 'mom'")
    
    def test_updated_timestamp_present(self):
        """Response should include updated timestamp"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical")
        data = response.json().get('data', {})
        updated = data.get('updated')
        
        assert updated is not None, "Missing 'updated' timestamp"
        print(f"PASS: Updated timestamp present: {updated}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
