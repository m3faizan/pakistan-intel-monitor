"""
Test SPI Weekly Enhancements
- Tests for q1-q5 quintile series
- Tests for increase/decrease/stable movement counts
- Tests for full week-end date in response
- Tests for no CPI regression
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestSPIWeeklyDataStructure:
    """Test SPI Weekly API returns correct data structure with quintile series"""

    @pytest.fixture(scope="class")
    def spi_weekly_data(self):
        """Fetch SPI weekly data once for all tests"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200, f"SPI weekly API failed: {response.status_code}"
        data = response.json().get("data", {})
        return data

    def test_spi_weekly_returns_200(self):
        """Test GET /api/spi-weekly returns 200"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200

    def test_spi_weekly_has_latest_value(self, spi_weekly_data):
        """Test SPI weekly has latest combined value"""
        assert "latest" in spi_weekly_data
        assert "value" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["value"] > 0

    def test_spi_weekly_has_week_ending_formatted(self, spi_weekly_data):
        """Test SPI weekly has week_ending_formatted field for full date display"""
        assert "week_ending_formatted" in spi_weekly_data["latest"]
        # Should be in format like "Dec 18, 2025"
        week_ending = spi_weekly_data["latest"]["week_ending_formatted"]
        assert len(week_ending) > 0
        # Check it contains month abbreviation and year
        assert any(month in week_ending for month in 
                   ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])

    def test_spi_weekly_has_quintile_q1(self, spi_weekly_data):
        """Test SPI weekly has Q1 quintile value"""
        assert "q1" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["q1"] is not None

    def test_spi_weekly_has_quintile_q2(self, spi_weekly_data):
        """Test SPI weekly has Q2 quintile value"""
        assert "q2" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["q2"] is not None

    def test_spi_weekly_has_quintile_q3(self, spi_weekly_data):
        """Test SPI weekly has Q3 quintile value"""
        assert "q3" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["q3"] is not None

    def test_spi_weekly_has_quintile_q4(self, spi_weekly_data):
        """Test SPI weekly has Q4 quintile value"""
        assert "q4" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["q4"] is not None

    def test_spi_weekly_has_quintile_q5(self, spi_weekly_data):
        """Test SPI weekly has Q5 quintile value"""
        assert "q5" in spi_weekly_data["latest"]
        assert spi_weekly_data["latest"]["q5"] is not None

    def test_spi_weekly_has_increase_count(self, spi_weekly_data):
        """Test SPI weekly has increase (price up) count"""
        assert "increase" in spi_weekly_data["latest"]
        increase = spi_weekly_data["latest"]["increase"]
        assert increase is not None
        assert isinstance(increase, int)
        assert increase >= 0

    def test_spi_weekly_has_decrease_count(self, spi_weekly_data):
        """Test SPI weekly has decrease (price down) count"""
        assert "decrease" in spi_weekly_data["latest"]
        decrease = spi_weekly_data["latest"]["decrease"]
        assert decrease is not None
        assert isinstance(decrease, int)
        assert decrease >= 0

    def test_spi_weekly_has_stable_count(self, spi_weekly_data):
        """Test SPI weekly has stable (no change) count"""
        assert "stable" in spi_weekly_data["latest"]
        stable = spi_weekly_data["latest"]["stable"]
        assert stable is not None
        assert isinstance(stable, int)
        assert stable >= 0

    def test_spi_weekly_movement_counts_sum_reasonable(self, spi_weekly_data):
        """Test that movement counts sum to items_tracked or reasonable value"""
        latest = spi_weekly_data["latest"]
        increase = latest.get("increase", 0)
        decrease = latest.get("decrease", 0)
        stable = latest.get("stable", 0)
        items = latest.get("items_tracked", 0)
        
        total_movements = increase + decrease + stable
        # If items_tracked is available and > 0, they should match
        if items > 0:
            assert total_movements == items, f"Movement sum {total_movements} != items_tracked {items}"
        else:
            # At minimum, total should be > 0 for recent data
            assert total_movements >= 0


class TestSPIWeeklyAvailableSeries:
    """Test SPI Weekly API returns available series for toggle functionality"""

    @pytest.fixture(scope="class")
    def spi_weekly_data(self):
        """Fetch SPI weekly data once for all tests"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200
        return response.json().get("data", {})

    def test_available_series_exists(self, spi_weekly_data):
        """Test available_series field exists"""
        assert "available_series" in spi_weekly_data

    def test_available_series_includes_combined(self, spi_weekly_data):
        """Test available_series includes 'value' (Combined)"""
        assert "value" in spi_weekly_data["available_series"]

    def test_available_series_includes_quintiles(self, spi_weekly_data):
        """Test available_series includes all quintiles"""
        series = spi_weekly_data["available_series"]
        assert "q1" in series
        assert "q2" in series
        assert "q3" in series
        assert "q4" in series
        assert "q5" in series

    def test_series_labels_exists(self, spi_weekly_data):
        """Test series_labels field exists"""
        assert "series_labels" in spi_weekly_data

    def test_series_labels_has_all_keys(self, spi_weekly_data):
        """Test series_labels has labels for all series"""
        labels = spi_weekly_data["series_labels"]
        assert labels.get("value") == "Combined"
        assert labels.get("q1") == "Q1"
        assert labels.get("q2") == "Q2"
        assert labels.get("q3") == "Q3"
        assert labels.get("q4") == "Q4"
        assert labels.get("q5") == "Q5"


class TestSPIWeeklyHistory:
    """Test SPI Weekly history contains quintile data"""

    @pytest.fixture(scope="class")
    def spi_weekly_data(self):
        """Fetch SPI weekly data once for all tests"""
        response = requests.get(f"{BASE_URL}/api/spi-weekly", timeout=30)
        assert response.status_code == 200
        return response.json().get("data", {})

    def test_history_not_empty(self, spi_weekly_data):
        """Test history contains data points"""
        assert "history" in spi_weekly_data
        assert len(spi_weekly_data["history"]) > 0

    def test_history_has_substantial_data(self, spi_weekly_data):
        """Test history has substantial data points (>100 weeks)"""
        assert len(spi_weekly_data["history"]) >= 100

    def test_history_entries_have_quintiles(self, spi_weekly_data):
        """Test history entries contain quintile values"""
        history = spi_weekly_data["history"]
        # Check first 5 entries
        for entry in history[:5]:
            assert "value" in entry
            assert "q1" in entry
            assert "q2" in entry
            assert "q3" in entry
            assert "q4" in entry
            assert "q5" in entry

    def test_history_entries_have_week_ending_formatted(self, spi_weekly_data):
        """Test history entries contain week_ending_formatted field"""
        history = spi_weekly_data["history"]
        for entry in history[:5]:
            assert "week_ending_formatted" in entry
            assert len(entry["week_ending_formatted"]) > 0


class TestCPINoRegression:
    """Test CPI APIs still work correctly (no regression from SPI changes)"""

    def test_cpi_yoy_returns_200(self):
        """Test CPI YoY API still works"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy", timeout=30)
        assert response.status_code == 200

    def test_cpi_yoy_has_data(self):
        """Test CPI YoY returns valid data"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy", timeout=30)
        data = response.json().get("data", {})
        assert "latest" in data
        assert data["latest"]["value"] > 0
        assert "history" in data
        assert len(data["history"]) > 0

    def test_cpi_mom_returns_200(self):
        """Test CPI MoM API still works"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom", timeout=30)
        assert response.status_code == 200

    def test_cpi_mom_has_data(self):
        """Test CPI MoM returns valid data"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom", timeout=30)
        data = response.json().get("data", {})
        assert "latest" in data
        assert "history" in data
        assert len(data["history"]) > 0

    def test_cpi_yoy_historical_returns_200(self):
        """Test CPI YoY Historical API still works"""
        response = requests.get(f"{BASE_URL}/api/cpi-yoy-historical", timeout=60)
        assert response.status_code == 200

    def test_cpi_mom_historical_returns_200(self):
        """Test CPI MoM Historical API still works"""
        response = requests.get(f"{BASE_URL}/api/cpi-mom-historical", timeout=60)
        assert response.status_code == 200


class TestSPIMonthlyNoRegression:
    """Test SPI Monthly API still works"""

    def test_spi_monthly_returns_200(self):
        """Test SPI Monthly API still works"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        assert response.status_code == 200

    def test_spi_monthly_has_data(self):
        """Test SPI Monthly returns valid data"""
        response = requests.get(f"{BASE_URL}/api/spi-monthly", timeout=30)
        data = response.json().get("data", {})
        assert "latest" in data
        assert data["latest"]["value"] > 0
        assert "history" in data
        assert len(data["history"]) > 0
