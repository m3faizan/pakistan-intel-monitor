"""
Test cases for Business Environment Panel and Gov Debt color semantics
Tests new features:
1. GET /api/business-environment - EPU Index, BCI, Sectors, Drivers
2. GET /api/gov-debt - Gov debt data with inverse color semantics validation
3. Validate response structures and data integrity
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pk-briefing-hub.preview.emergentagent.com').rstrip('/')


class TestBusinessEnvironmentAPI:
    """Tests for /api/business-environment endpoint"""

    def test_business_environment_returns_200(self):
        """Test that business environment endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/business-environment returns 200")

    def test_business_environment_has_epu_data(self):
        """Test that EPU data is present with headline, history"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        # Check EPU structure
        assert 'epu' in data, "EPU key missing"
        epu = data['epu']
        
        assert 'headline' in epu, "EPU headline missing"
        assert 'history' in epu, "EPU history missing"
        assert 'description' in epu, "EPU description missing"
        
        # Validate headline data
        headline = epu['headline']
        assert headline.get('latest'), "EPU latest value missing"
        assert 'value' in headline['latest'], "EPU latest value field missing"
        assert headline['latest']['value'] > 0, "EPU value should be positive"
        
        print(f"PASS: EPU headline value: {headline['latest']['value']}")

    def test_business_environment_has_confidence_data(self):
        """Test that Business Confidence Index data is present"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        assert 'confidence' in data, "Confidence key missing"
        confidence = data['confidence']
        
        # Check headline confidence metrics
        assert 'headline' in confidence, "Confidence headline missing"
        headline = confidence['headline']
        
        assert 'overall' in headline, "Overall BCI missing"
        assert 'current' in headline, "Current BCI missing"
        assert 'expected' in headline, "Expected BCI missing"
        
        # Validate current BCI
        current = headline.get('current', {})
        assert current.get('latest'), "Current BCI latest missing"
        assert 'value' in current['latest'], "Current BCI value missing"
        
        # Validate expected BCI
        expected = headline.get('expected', {})
        assert expected.get('latest'), "Expected BCI latest missing"
        assert 'value' in expected['latest'], "Expected BCI value missing"
        
        print(f"PASS: Current BCI: {current['latest']['value']}, Expected BCI: {expected['latest']['value']}")

    def test_business_environment_has_sectors_data(self):
        """Test that sector confidence breakdown is present"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        sectors = data.get('confidence', {}).get('sectors', {})
        assert 'latest' in sectors, "Sectors latest missing"
        
        sector_list = sectors['latest']
        assert len(sector_list) >= 4, f"Expected at least 4 sectors, got {len(sector_list)}"
        
        expected_sectors = ['Manufacturing', 'Construction', 'Wholesale & Retail', 'Other Services']
        sector_names = [s['name'] for s in sector_list]
        
        for expected in expected_sectors:
            assert expected in sector_names, f"Sector '{expected}' missing"
        
        print(f"PASS: Sectors: {sector_names}")

    def test_business_environment_has_drivers_data(self):
        """Test that BCI drivers data is present"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        drivers = data.get('confidence', {}).get('drivers', {})
        
        expected_drivers = ['general_economic', 'employment', 'demand_for_credit', 'inflation_expectation']
        
        for driver in expected_drivers:
            assert driver in drivers, f"Driver '{driver}' missing"
            driver_data = drivers[driver]
            # Check current/expected structure
            assert 'current' in driver_data or 'expected' in driver_data, f"Driver {driver} missing current/expected data"
        
        print(f"PASS: Drivers present: {list(drivers.keys())}")

    def test_business_environment_has_history(self):
        """Test that confidence history data is present for charts"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        confidence_history = data.get('confidence', {}).get('history', [])
        assert len(confidence_history) > 0, "Confidence history empty"
        
        # Check history entry structure
        sample_entry = confidence_history[-1]  # Most recent
        assert 'date' in sample_entry, "History date missing"
        assert 'bci' in sample_entry or 'cbci' in sample_entry or 'ebci' in sample_entry, "History BCI values missing"
        
        print(f"PASS: Confidence history: {len(confidence_history)} data points")

    def test_business_environment_epu_history(self):
        """Test that EPU history data is present for charts"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        epu_history = data.get('epu', {}).get('history', [])
        assert len(epu_history) > 0, "EPU history empty"
        
        # Check EPU history structure
        sample_entry = epu_history[-1]
        assert 'date' in sample_entry, "EPU history date missing"
        assert 'epu4' in sample_entry or 'epu2' in sample_entry, "EPU history values missing"
        
        print(f"PASS: EPU history: {len(epu_history)} data points")

    def test_business_environment_metadata(self):
        """Test that metadata fields are present"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        
        assert 'latest_month' in data, "latest_month missing"
        assert 'source' in data, "source missing"
        assert 'methodology_url' in data, "methodology_url missing"
        assert 'coverage' in data, "coverage missing"
        
        print(f"PASS: Metadata - latest_month: {data.get('latest_month')}, source: {data.get('source')}")


class TestGovDebtAPI:
    """Tests for /api/gov-debt endpoint and inverse color semantics"""

    def test_gov_debt_returns_200(self):
        """Test that gov debt endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: GET /api/gov-debt returns 200")

    def test_gov_debt_has_latest_value(self):
        """Test that gov debt has latest value with breakdown"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        data = response.json().get('data', {})
        
        assert 'latest' in data, "Latest data missing"
        latest = data['latest']
        
        assert 'value' in latest, "Total value missing"
        assert 'internal_debt' in latest, "Internal debt missing"
        assert 'external_debt' in latest, "External debt missing"
        assert 'month' in latest, "Month missing"
        assert 'unit' in latest, "Unit missing"
        
        print(f"PASS: Gov Debt latest: ₨{latest['value']}B ({latest['month']})")
        print(f"      Internal: ₨{latest['internal_debt']}B, External: ₨{latest['external_debt']}B")

    def test_gov_debt_has_mom_change(self):
        """Test that MoM change is present for color semantics"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        data = response.json().get('data', {})
        
        assert 'mom_change' in data, "MoM change missing"
        mom_change = data['mom_change']
        
        assert mom_change is not None, "MoM change is None"
        assert isinstance(mom_change, (int, float)), "MoM change should be numeric"
        
        # For debt, positive MoM means increase (BAD), negative means decrease (GOOD)
        color_semantics = "RED (bad)" if mom_change > 0 else "GREEN (good)" if mom_change < 0 else "NEUTRAL"
        print(f"PASS: Gov Debt MoM change: {mom_change:.2f}% - Color: {color_semantics}")

    def test_gov_debt_has_history(self):
        """Test that history data is present for charts"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        data = response.json().get('data', {})
        
        assert 'history' in data, "History missing"
        history = data['history']
        assert len(history) > 0, "History empty"
        
        # Check history entry structure
        sample = history[0]
        assert 'date' in sample, "History date missing"
        assert 'value' in sample, "History value missing"
        assert 'internal_debt' in sample, "History internal_debt missing"
        assert 'external_debt' in sample, "History external_debt missing"
        
        print(f"PASS: Gov Debt history: {len(history)} data points")

    def test_gov_debt_breakdown(self):
        """Test that breakdown metadata is present"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        data = response.json().get('data', {})
        
        assert 'breakdown' in data, "Breakdown missing"
        breakdown = data['breakdown']
        
        assert 'internal_debt' in breakdown, "Internal debt breakdown missing"
        assert 'external_debt' in breakdown, "External debt breakdown missing"
        
        print(f"PASS: Breakdown metadata present")


class TestEconomicEndpointsRegression:
    """Regression tests for existing economic endpoints"""

    def test_remittances_still_works(self):
        """Regression: Remittances endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/remittances")
        assert response.status_code == 200, f"Remittances failed: {response.status_code}"
        print("PASS: /api/remittances returns 200 (no regression)")

    def test_forex_reserves_still_works(self):
        """Regression: Forex reserves endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/forex-reserves")
        assert response.status_code == 200, f"Forex reserves failed: {response.status_code}"
        print("PASS: /api/forex-reserves returns 200 (no regression)")

    def test_gold_reserves_still_works(self):
        """Regression: Gold reserves endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/gold-reserves")
        assert response.status_code == 200, f"Gold reserves failed: {response.status_code}"
        print("PASS: /api/gold-reserves returns 200 (no regression)")

    def test_imports_still_works(self):
        """Regression: Imports endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/imports")
        assert response.status_code == 200, f"Imports failed: {response.status_code}"
        print("PASS: /api/imports returns 200 (no regression)")

    def test_exports_still_works(self):
        """Regression: Exports endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/exports")
        assert response.status_code == 200, f"Exports failed: {response.status_code}"
        print("PASS: /api/exports returns 200 (no regression)")

    def test_pkr_usd_still_works(self):
        """Regression: PKR/USD endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/pkr-usd")
        assert response.status_code == 200, f"PKR/USD failed: {response.status_code}"
        print("PASS: /api/pkr-usd returns 200 (no regression)")

    def test_current_account_still_works(self):
        """Regression: Current account endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/current-account")
        assert response.status_code == 200, f"Current account failed: {response.status_code}"
        print("PASS: /api/current-account returns 200 (no regression)")

    def test_liquid_forex_still_works(self):
        """Regression: Liquid forex endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/liquid-forex")
        assert response.status_code == 200, f"Liquid forex failed: {response.status_code}"
        print("PASS: /api/liquid-forex returns 200 (no regression)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
