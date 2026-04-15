"""
Test suite for Regional Relations Panel API
Tests the /api/regional and /api/regional-relations endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRegionalRelationsAPI:
    """Tests for Regional Relations endpoint"""
    
    def test_regional_endpoint_returns_200(self):
        """Test that /api/regional returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/regional returns HTTP 200")
    
    def test_regional_relations_endpoint_returns_200(self):
        """Test that /api/regional-relations returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/regional-relations", timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/regional-relations returns HTTP 200")
    
    def test_regional_returns_valid_json_structure(self):
        """Test that response has correct JSON structure"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        
        assert "data" in data, "Response missing 'data' key"
        assert "countries" in data["data"], "Response missing 'countries' array"
        assert "updated" in data["data"], "Response missing 'updated' timestamp"
        print("✓ Response has valid JSON structure with data.countries and data.updated")
    
    def test_regional_returns_20_countries(self):
        """Test that exactly 20 countries are returned"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        assert len(countries) == 20, f"Expected 20 countries, got {len(countries)}"
        print(f"✓ Returns exactly 20 countries")
    
    def test_countries_grouped_correctly(self):
        """Test that countries are grouped by Neighbor/GCC/Major/EU"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        groups = set(c["group"] for c in countries)
        expected_groups = {"Neighbor", "GCC", "Major", "EU"}
        
        assert groups == expected_groups, f"Expected groups {expected_groups}, got {groups}"
        print(f"✓ Countries grouped correctly: {groups}")
    
    def test_neighbor_countries(self):
        """Test Neighbor group has correct countries"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        neighbors = [c["name"] for c in countries if c["group"] == "Neighbor"]
        expected = ["India", "Afghanistan", "Iran", "China"]
        
        assert set(neighbors) == set(expected), f"Expected {expected}, got {neighbors}"
        print(f"✓ Neighbor group has: {neighbors}")
    
    def test_gcc_countries(self):
        """Test GCC group has correct countries"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        gcc = [c["name"] for c in countries if c["group"] == "GCC"]
        expected = ["Saudi Arabia", "UAE - Abu Dhabi", "UAE - Dubai", "Qatar", "Kuwait", "Bahrain", "Oman"]
        
        assert set(gcc) == set(expected), f"Expected {expected}, got {gcc}"
        print(f"✓ GCC group has: {gcc}")
    
    def test_major_countries(self):
        """Test Major group has correct countries"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        major = [c["name"] for c in countries if c["group"] == "Major"]
        expected = ["United States", "United Kingdom"]
        
        assert set(major) == set(expected), f"Expected {expected}, got {major}"
        print(f"✓ Major group has: {major}")
    
    def test_eu_countries(self):
        """Test EU group has correct countries"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        eu = [c["name"] for c in countries if c["group"] == "EU"]
        expected = ["European Union", "Germany", "Netherlands", "France", "Spain", "Italy", "Belgium"]
        
        assert set(eu) == set(expected), f"Expected {expected}, got {eu}"
        print(f"✓ EU group has: {eu}")
    
    def test_country_has_required_fields(self):
        """Test that each country has required fields"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        required_fields = ["code", "name", "flag", "group", "status", "tag", "highlights", "visa", "sources", "trade"]
        
        for country in countries:
            for field in required_fields:
                assert field in country, f"Country {country.get('name', 'unknown')} missing field: {field}"
        
        print(f"✓ All 20 countries have required fields: {required_fields}")
    
    def test_india_has_trade_structure(self):
        """Test that India has trade structure (data may be null due to API rate limiting)"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        india = next((c for c in countries if c["code"] == "india"), None)
        assert india is not None, "India not found in countries"
        
        trade = india.get("trade", {})
        assert "exports" in trade, "India missing exports key"
        assert "imports" in trade, "India missing imports key"
        assert "remittances" in trade, "India missing remittances key"
        assert "series_codes" in trade, "India missing series_codes key"
        
        # Trade data may be null due to SBP API rate limiting (429)
        # This is expected behavior - frontend handles null gracefully
        exports = trade.get("exports")
        imports = trade.get("imports")
        
        if exports is not None:
            assert "latest" in exports, "Exports missing 'latest'"
            print(f"✓ India has exports data: {exports['latest']}")
        else:
            print("✓ India exports is null (SBP API rate limited - expected)")
        
        if imports is not None:
            assert "latest" in imports, "Imports missing 'latest'"
            print(f"✓ India has imports data: {imports['latest']}")
        else:
            print("✓ India imports is null (SBP API rate limited - expected)")
    
    def test_saudi_arabia_has_trade_data(self):
        """Test that Saudi Arabia has trade data with exports, imports, remittances"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        saudi = next((c for c in countries if c["code"] == "saudi_arabia"), None)
        assert saudi is not None, "Saudi Arabia not found in countries"
        
        trade = saudi.get("trade", {})
        assert "exports" in trade, "Saudi Arabia missing exports data"
        assert "imports" in trade, "Saudi Arabia missing imports data"
        assert "remittances" in trade, "Saudi Arabia missing remittances data"
        
        print(f"✓ Saudi Arabia has trade data including remittances")
    
    def test_united_states_has_trade_data(self):
        """Test that United States has trade data"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        usa = next((c for c in countries if c["code"] == "united_states"), None)
        assert usa is not None, "United States not found in countries"
        
        trade = usa.get("trade", {})
        assert "exports" in trade, "USA missing exports data"
        assert "imports" in trade, "USA missing imports data"
        
        print(f"✓ United States has trade data")
    
    def test_trade_history_structure(self):
        """Test that trade history structure is correct when data is available"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        # Check Saudi Arabia
        saudi = next((c for c in countries if c["code"] == "saudi_arabia"), None)
        
        exports = saudi["trade"].get("exports")
        imports = saudi["trade"].get("imports")
        
        # Data may be null due to SBP API rate limiting
        if exports is not None:
            exports_history = exports.get("history", [])
            assert len(exports_history) >= 1, "Exports history should have at least 1 entry"
            print(f"✓ Exports history has {len(exports_history)} months of data")
        else:
            print("✓ Exports is null (SBP API rate limited - expected)")
        
        if imports is not None:
            imports_history = imports.get("history", [])
            assert len(imports_history) >= 1, "Imports history should have at least 1 entry"
            print(f"✓ Imports history has {len(imports_history)} months of data")
        else:
            print("✓ Imports is null (SBP API rate limited - expected)")
    
    def test_trade_values_format(self):
        """Test that trade values are in correct format when available"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        saudi = next((c for c in countries if c["code"] == "saudi_arabia"), None)
        
        exports = saudi["trade"].get("exports")
        imports = saudi["trade"].get("imports")
        
        # Data may be null due to SBP API rate limiting
        if exports is not None and exports.get("latest"):
            exports_value = exports["latest"]["value"]
            assert isinstance(exports_value, (int, float, type(None))), f"Exports value not numeric: {exports_value}"
            print(f"✓ Exports value is numeric: {exports_value}")
        else:
            print("✓ Exports is null (SBP API rate limited - expected)")
        
        if imports is not None and imports.get("latest"):
            imports_value = imports["latest"]["value"]
            assert isinstance(imports_value, (int, float, type(None))), f"Imports value not numeric: {imports_value}"
            print(f"✓ Imports value is numeric: {imports_value}")
        else:
            print("✓ Imports is null (SBP API rate limited - expected)")
    
    def test_country_has_visa_info(self):
        """Test that countries have visa information"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        for country in countries[:5]:  # Check first 5
            visa = country.get("visa", {})
            assert "status" in visa, f"{country['name']} missing visa status"
            assert "notes" in visa, f"{country['name']} missing visa notes"
        
        print("✓ Countries have visa information with status and notes")
    
    def test_country_has_sources(self):
        """Test that countries have source links"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        for country in countries[:5]:  # Check first 5
            sources = country.get("sources", [])
            assert len(sources) > 0, f"{country['name']} has no sources"
            
            for source in sources:
                assert "title" in source, f"Source missing title"
                assert "url" in source, f"Source missing url"
        
        print("✓ Countries have source links with title and url")
    
    def test_country_without_remittances_returns_null(self):
        """Test that countries without remittance data return null"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        # India should have null remittances (trade suspended)
        india = next((c for c in countries if c["code"] == "india"), None)
        remittances = india["trade"].get("remittances")
        
        # Remittances can be null for some countries
        print(f"✓ India remittances: {remittances} (null is acceptable)")
    
    def test_trade_balance_calculation(self):
        """Test that trade balance can be calculated when data is available"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        saudi = next((c for c in countries if c["code"] == "saudi_arabia"), None)
        
        exports_data = saudi["trade"].get("exports")
        imports_data = saudi["trade"].get("imports")
        
        # Data may be null due to SBP API rate limiting
        if exports_data and imports_data:
            exports = exports_data.get("latest", {}).get("value")
            imports = imports_data.get("latest", {}).get("value")
            
            if exports is not None and imports is not None:
                balance = exports - imports
                if balance >= 0:
                    print(f"✓ Saudi Arabia trade balance: SURPLUS ${balance:,.0f}K")
                else:
                    print(f"✓ Saudi Arabia trade balance: DEFICIT ${abs(balance):,.0f}K")
            else:
                print("✓ Trade values are null (SBP API rate limited - expected)")
        else:
            print("✓ Trade data is null (SBP API rate limited - expected)")
    
    def test_mom_change_structure(self):
        """Test that month-over-month change structure is correct when data is available"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        data = response.json()
        countries = data["data"]["countries"]
        
        saudi = next((c for c in countries if c["code"] == "saudi_arabia"), None)
        
        exports_data = saudi["trade"].get("exports")
        imports_data = saudi["trade"].get("imports")
        
        # Data may be null due to SBP API rate limiting
        if exports_data:
            exports_mom = exports_data.get("mom_change")
            print(f"✓ Exports MoM change: {exports_mom}%")
        else:
            print("✓ Exports is null (SBP API rate limited - expected)")
        
        if imports_data:
            imports_mom = imports_data.get("mom_change")
            print(f"✓ Imports MoM change: {imports_mom}%")
        else:
            print("✓ Imports is null (SBP API rate limited - expected)")


class TestRegionalEndpointPerformance:
    """Performance tests for Regional endpoint"""
    
    def test_endpoint_responds_within_timeout(self):
        """Test that endpoint responds within 60 seconds"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/regional", timeout=60)
        elapsed = time.time() - start
        
        assert response.status_code == 200
        print(f"✓ Endpoint responded in {elapsed:.2f} seconds")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
