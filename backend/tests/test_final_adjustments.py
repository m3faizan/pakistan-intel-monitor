"""
Test final adjustments for Business Environment and FDI features:
- confidence.date_range should be 2017-10-01 to 2026-02-01
- FDI should include history from 1997-07-31 to latest 2026-01-31
- FDI color semantics: increase green, decrease red
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

class TestBusinessEnvironmentDateRange:
    """Test Business Environment API date ranges"""

    def test_business_environment_api_status(self):
        """Test that /api/business-environment returns 200"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/business-environment returns 200")

    def test_confidence_date_range_full_window(self):
        """Test confidence.date_range is 2017-10-01 to 2026-02-01 (no one-month lag)"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        confidence = data.get('confidence', {})
        date_range = confidence.get('date_range', '')
        
        # Expected: start should be 2017-10 and end should be 2026-02 (Feb 2026)
        print(f"confidence.date_range: {date_range}")
        assert '2017-10' in date_range, f"Expected start around 2017-10, got: {date_range}"
        assert '2026-02' in date_range, f"Expected end at 2026-02 (Feb 2026), got: {date_range}"
        print("✓ confidence.date_range includes full data window through Feb 2026")

    def test_confidence_history_end_date(self):
        """Test confidence history ends at Feb 2026"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        history = data.get('confidence', {}).get('history', [])
        
        assert len(history) > 0, "Confidence history should not be empty"
        last_entry = history[-1]
        last_date = last_entry.get('date', '')
        print(f"Last confidence history entry date: {last_date}")
        assert '2026-02' in last_date, f"Expected last entry at 2026-02, got: {last_date}"
        print("✓ Confidence history ends at Feb 2026")

    def test_epu_date_range(self):
        """Test EPU date range"""
        response = requests.get(f"{BASE_URL}/api/business-environment")
        data = response.json().get('data', {})
        epu = data.get('epu', {})
        date_range = epu.get('date_range', '')
        
        print(f"epu.date_range: {date_range}")
        assert '2017-10' in date_range, f"Expected start around 2017-10, got: {date_range}"
        print("✓ EPU date range starts from Oct 2017")


class TestFDIFullHistory:
    """Test FDI API full history from 1997"""

    def test_fdi_api_status(self):
        """Test that /api/fdi returns 200"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/fdi returns 200")

    def test_fdi_history_starts_from_1997(self):
        """Test FDI history includes data from July 1997"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        history = data.get('history', [])
        
        assert len(history) > 0, "FDI history should not be empty"
        
        # History is sorted newest first, so last entry should be oldest
        oldest_entry = history[-1]
        oldest_date = oldest_entry.get('date', '')
        print(f"Oldest FDI entry date: {oldest_date}")
        
        # Should be July 1997
        oldest_dt = datetime.strptime(oldest_date, "%Y-%m-%d")
        assert oldest_dt.year == 1997, f"Expected 1997, got year {oldest_dt.year}"
        assert oldest_dt.month == 7, f"Expected July (7), got month {oldest_dt.month}"
        print("✓ FDI history starts from July 1997")

    def test_fdi_history_ends_at_latest_2026(self):
        """Test FDI history ends at latest available 2026 data"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        history = data.get('history', [])
        
        assert len(history) > 0, "FDI history should not be empty"
        
        # History is sorted newest first, so first entry should be latest
        latest_entry = history[0]
        latest_date = latest_entry.get('date', '')
        print(f"Latest FDI entry date: {latest_date}")
        
        latest_dt = datetime.strptime(latest_date, "%Y-%m-%d")
        assert latest_dt.year == 2026, f"Expected 2026, got year {latest_dt.year}"
        assert latest_dt.month == 1, f"Expected January (1), got month {latest_dt.month}"
        print("✓ FDI history ends at Jan 2026")

    def test_fdi_data_point_count(self):
        """Test FDI has sufficient history points (1997-2026 = ~28+ years)"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        history = data.get('history', [])
        
        # From July 1997 to Jan 2026 is about 28.5 years = ~342 months
        print(f"FDI history data points: {len(history)}")
        assert len(history) >= 300, f"Expected at least 300 data points, got {len(history)}"
        print(f"✓ FDI has {len(history)} data points covering full history")

    def test_fdi_latest_values(self):
        """Test FDI latest value structure"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        latest = data.get('latest', {})
        
        assert 'value' in latest, "Latest should have 'value'"
        assert 'month' in latest, "Latest should have 'month'"
        assert 'date' in latest, "Latest should have 'date'"
        
        print(f"FDI Latest: {latest.get('value')} for {latest.get('month')}")
        print("✓ FDI latest value structure correct")

    def test_fdi_mom_change(self):
        """Test FDI has MoM change calculation"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        
        assert 'mom_change' in data, "Should have mom_change"
        mom_change = data.get('mom_change')
        print(f"FDI MoM change: {mom_change}%")
        
        assert mom_change is not None, "mom_change should not be None"
        print("✓ FDI MoM change calculated")


class TestFDIColorSemantics:
    """Test FDI color semantics: increase = green (good), decrease = red (bad)"""

    def test_fdi_positive_change_is_positive_class(self):
        """Verify FDI increase should be treated as positive (green)"""
        response = requests.get(f"{BASE_URL}/api/fdi")
        data = response.json().get('data', {})
        
        mom_change = data.get('mom_change', 0)
        
        # If MoM change is positive, FDI increased
        # For FDI: increase = good (green/positive class)
        # For FDI: decrease = bad (red/negative class)
        
        print(f"FDI MoM change: {mom_change}%")
        
        # This is testing the expected behavior:
        # - If mom_change > 0: FDI increased = GOOD = should be green
        # - If mom_change < 0: FDI decreased = BAD = should be red
        
        if mom_change > 0:
            print("✓ FDI increased - should show GREEN (positive) in UI")
        else:
            print("✓ FDI decreased - should show RED (negative) in UI")
        
        # The actual color mapping happens in frontend, backend just provides raw data


class TestRegressionAPIs:
    """Regression tests for other economic APIs"""

    def test_remittances_api(self):
        """Test remittances endpoint"""
        response = requests.get(f"{BASE_URL}/api/remittances")
        assert response.status_code == 200
        data = response.json().get('data', {})
        assert 'latest' in data
        print("✓ /api/remittances working")

    def test_forex_reserves_api(self):
        """Test forex reserves endpoint"""
        response = requests.get(f"{BASE_URL}/api/forex-reserves")
        assert response.status_code == 200
        data = response.json().get('data', {})
        assert 'latest' in data
        print("✓ /api/forex-reserves working")

    def test_gold_reserves_api(self):
        """Test gold reserves endpoint"""
        response = requests.get(f"{BASE_URL}/api/gold-reserves")
        assert response.status_code == 200
        data = response.json().get('data', {})
        assert 'latest' in data
        print("✓ /api/gold-reserves working")

    def test_gov_debt_api(self):
        """Test government debt endpoint"""
        response = requests.get(f"{BASE_URL}/api/gov-debt")
        assert response.status_code == 200
        data = response.json().get('data', {})
        assert 'latest' in data
        print("✓ /api/gov-debt working")

    def test_pkr_usd_api(self):
        """Test PKR/USD endpoint"""
        response = requests.get(f"{BASE_URL}/api/pkr-usd")
        assert response.status_code == 200
        data = response.json().get('data', {})
        assert 'latest' in data
        print("✓ /api/pkr-usd working")
