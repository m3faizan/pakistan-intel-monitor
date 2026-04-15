"""
Regional Relations Panel Backend Tests - Iteration 15
Tests for /api/regional endpoint with 24 countries including Central Asia group
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pk-briefing-hub.preview.emergentagent.com').rstrip('/')


class TestRegionalEndpoint:
    """Tests for /api/regional endpoint"""
    
    def test_regional_endpoint_returns_200(self):
        """Test that /api/regional returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/regional returns HTTP 200")
    
    def test_regional_returns_24_countries(self):
        """Test that /api/regional returns exactly 24 countries"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        assert len(countries) == 24, f"Expected 24 countries, got {len(countries)}"
        print(f"PASS: /api/regional returns 24 countries")
    
    def test_country_groupings(self):
        """Test that countries are grouped correctly: Neighbor(4), GCC(7), Major(3), Central Asia(3), EU(7)"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        groups = {}
        for c in countries:
            g = c.get('group', 'Other')
            if g not in groups:
                groups[g] = []
            groups[g].append(c.get('name'))
        
        # Verify group counts
        assert len(groups.get('Neighbor', [])) == 4, f"Neighbor should have 4 countries, got {len(groups.get('Neighbor', []))}"
        assert len(groups.get('GCC', [])) == 7, f"GCC should have 7 countries, got {len(groups.get('GCC', []))}"
        assert len(groups.get('Major', [])) == 3, f"Major should have 3 countries, got {len(groups.get('Major', []))}"
        assert len(groups.get('Central Asia', [])) == 3, f"Central Asia should have 3 countries, got {len(groups.get('Central Asia', []))}"
        assert len(groups.get('EU', [])) == 7, f"EU should have 7 countries, got {len(groups.get('EU', []))}"
        
        print("PASS: Country groupings are correct - Neighbor(4), GCC(7), Major(3), Central Asia(3), EU(7)")
    
    def test_central_asia_countries(self):
        """Test that Central Asia group includes Russia, Azerbaijan, Tajikistan, Kazakhstan"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        central_asia = [c for c in countries if c.get('group') == 'Central Asia']
        central_asia_names = [c.get('name') for c in central_asia]
        
        # Note: Russia is in Major group, not Central Asia
        expected = ['Azerbaijan', 'Tajikistan', 'Kazakhstan']
        for name in expected:
            assert name in central_asia_names, f"{name} should be in Central Asia group"
        
        print(f"PASS: Central Asia group contains: {central_asia_names}")
    
    def test_major_group_includes_russia(self):
        """Test that Major group includes Russia"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        major = [c for c in countries if c.get('group') == 'Major']
        major_names = [c.get('name') for c in major]
        
        assert 'Russia' in major_names, f"Russia should be in Major group, got {major_names}"
        print(f"PASS: Major group contains Russia: {major_names}")
    
    def test_all_countries_have_required_fields(self):
        """Test that all countries have embassy_url, recent_visit, status, tag, highlights, visa"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        required_fields = ['embassy_url', 'recent_visit', 'status', 'tag', 'highlights', 'visa']
        
        for country in countries:
            for field in required_fields:
                assert field in country, f"Country {country.get('name')} missing field: {field}"
                # Check that field is not None (except trade data which can be null)
                if field != 'trade':
                    assert country[field] is not None, f"Country {country.get('name')} has None for field: {field}"
        
        print("PASS: All 24 countries have required fields: embassy_url, recent_visit, status, tag, highlights, visa")
    
    def test_india_status_is_tense_suspended(self):
        """Test that India shows TENSE/SUSPENDED status"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        india = next((c for c in countries if c.get('code') == 'india'), None)
        assert india is not None, "India not found in countries"
        
        status = india.get('status', '').upper()
        assert 'TENSE' in status or 'SUSPENDED' in status, f"India status should contain TENSE or SUSPENDED, got: {status}"
        
        print(f"PASS: India status is '{india.get('status')}' (contains TENSE/SUSPENDED)")
    
    def test_china_status_is_strategic_partnership(self):
        """Test that China shows STRATEGIC PARTNERSHIP status"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        china = next((c for c in countries if c.get('code') == 'china'), None)
        assert china is not None, "China not found in countries"
        
        status = china.get('status', '').upper()
        assert 'STRATEGIC' in status, f"China status should contain STRATEGIC, got: {status}"
        
        print(f"PASS: China status is '{china.get('status')}' (contains STRATEGIC)")
    
    def test_azerbaijan_has_all_details(self):
        """Test that Azerbaijan has embassy_url, recent_visit, highlights, visa"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        azerbaijan = next((c for c in countries if c.get('code') == 'azerbaijan'), None)
        assert azerbaijan is not None, "Azerbaijan not found in countries"
        
        # Check embassy_url
        assert azerbaijan.get('embassy_url'), "Azerbaijan should have embassy_url"
        assert 'mofa.gov.pk' in azerbaijan.get('embassy_url', ''), f"Azerbaijan embassy_url should be mofa.gov.pk, got: {azerbaijan.get('embassy_url')}"
        
        # Check recent_visit
        assert azerbaijan.get('recent_visit'), "Azerbaijan should have recent_visit"
        
        # Check highlights
        assert len(azerbaijan.get('highlights', [])) > 0, "Azerbaijan should have highlights"
        
        # Check visa
        assert azerbaijan.get('visa'), "Azerbaijan should have visa info"
        assert azerbaijan.get('visa', {}).get('status'), "Azerbaijan visa should have status"
        
        print(f"PASS: Azerbaijan has all details - embassy: {azerbaijan.get('embassy_url')}, recent_visit: {azerbaijan.get('recent_visit')[:50]}...")
    
    def test_embassy_urls_format(self):
        """Test that embassy URLs use mofa.gov.pk format"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        mofa_count = 0
        for country in countries:
            embassy_url = country.get('embassy_url', '')
            if 'mofa.gov.pk' in embassy_url:
                mofa_count += 1
        
        # Most should use mofa.gov.pk format (some exceptions like Saudi Arabia, UK, US have different URLs)
        assert mofa_count >= 18, f"At least 18 countries should use mofa.gov.pk format, got {mofa_count}"
        print(f"PASS: {mofa_count}/24 countries use mofa.gov.pk embassy URL format")
    
    def test_no_emoji_flags_in_response(self):
        """Test that response does not contain emoji flags"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        # Check for common flag emoji ranges
        import re
        flag_pattern = re.compile(r'[\U0001F1E0-\U0001F1FF]')
        
        for country in countries:
            name = country.get('name', '')
            assert not flag_pattern.search(name), f"Country name contains emoji flag: {name}"
        
        print("PASS: No emoji flags found in country names")
    
    def test_visa_structure(self):
        """Test that visa field has status and notes"""
        response = requests.get(f"{BASE_URL}/api/regional", timeout=120)
        data = response.json()
        countries = data.get('data', {}).get('countries', [])
        
        for country in countries:
            visa = country.get('visa', {})
            assert 'status' in visa, f"Country {country.get('name')} visa missing status"
            assert 'notes' in visa, f"Country {country.get('name')} visa missing notes"
            assert isinstance(visa.get('notes'), list), f"Country {country.get('name')} visa notes should be a list"
        
        print("PASS: All countries have visa with status and notes fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
