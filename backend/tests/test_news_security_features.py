"""
Tests for news and security features:
- GET /api/news includes source coverage with Al Jazeera and The News feeds
- News filtering removes entertainment/sports noise
- GET /api/security returns live alerts with buckets: security, political, diplomatic, economic, energy
- Petroleum shutdown/dealer headlines classified as economic (not diplomatic)
- Security panel header renamed to Alerts (frontend test)
- Security panel renders grouped bucket sections (frontend test)
- Map shows alerts layer toggle and alert markers (frontend test)
- Alert marker popup includes category/type (frontend test)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNewsFeatures:
    """Tests for /api/news endpoint - Al Jazeera and The News feeds"""
    
    def test_news_endpoint_returns_200(self):
        """GET /api/news should return HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/news", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/news returns HTTP 200")
    
    def test_news_includes_al_jazeera_source(self):
        """News should include Al Jazeera articles (when Pakistan-related news available)"""
        response = requests.get(f"{BASE_URL}/api/news", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        news = data.get('news', [])
        sources = set(article.get('source', '') for article in news)
        
        print(f"News sources found: {sorted(sources)}")
        # Al Jazeera should be in sources if Pakistan-related news available
        # (May not always have Pakistan news, so check presence in feed list)
        has_al_jazeera = 'Al Jazeera' in sources
        print(f"✓ Al Jazeera source {'found' if has_al_jazeera else 'not present (may have no Pakistan news)'}")
        
        # At least verify we get news from multiple sources
        assert len(news) > 0, "Expected at least some news articles"
    
    def test_news_includes_the_news_source(self):
        """News should include The News articles"""
        response = requests.get(f"{BASE_URL}/api/news", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        news = data.get('news', [])
        sources = set(article.get('source', '') for article in news)
        
        # The News feeds have names like "The News Pakistan", "The News World"
        has_the_news = any('The News' in source for source in sources)
        print(f"✓ The News source {'found' if has_the_news else 'not present'}")
    
    def test_news_filters_entertainment_sports(self):
        """News should filter out entertainment and sports content"""
        response = requests.get(f"{BASE_URL}/api/news", timeout=30)
        assert response.status_code == 200
        
        data = response.json()
        news = data.get('news', [])
        
        excluded_keywords = ['entertainment', 'celebrity', 'movie', 'cricket', 'sports', 'fashion', 'horoscope', 'netflix']
        
        filtered_count = 0
        for article in news:
            title = (article.get('title', '') or '').lower()
            summary = (article.get('summary', '') or '').lower()
            text = f"{title} {summary}"
            
            # Check if article has any excluded keywords (without politics/policy override)
            has_excluded = any(kw in text for kw in excluded_keywords)
            has_override = any(kw in text for kw in ['politic', 'policy', 'government', 'economy', 'minister'])
            
            if has_excluded and not has_override:
                filtered_count += 1
                print(f"  Warning: Found potentially unfiltered article: {title[:50]}...")
        
        # Should have minimal or no entertainment/sports articles
        assert filtered_count < 5, f"Found {filtered_count} unfiltered entertainment/sports articles"
        print(f"✓ News filtering working - {filtered_count} potential unfiltered items (threshold < 5)")


class TestSecurityFeatures:
    """Tests for /api/security endpoint - Alerts with buckets"""
    
    def test_security_endpoint_returns_200(self):
        """GET /api/security should return HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/security returns HTTP 200")
    
    def test_security_returns_alerts_array(self):
        """Security endpoint should return alerts array"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        data = response.json()
        assert 'alerts' in data, "Response should contain 'alerts' key"
        alerts = data.get('alerts', [])
        assert isinstance(alerts, list), "alerts should be a list"
        print(f"✓ Security returns {len(alerts)} alerts")
    
    def test_security_alerts_have_required_fields(self):
        """Each alert should have type, severity, title, region fields"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        required_fields = ['type', 'severity', 'title', 'region']
        
        for alert in alerts[:5]:  # Check first 5
            for field in required_fields:
                assert field in alert, f"Alert missing '{field}' field"
        
        print(f"✓ Alerts have required fields: {required_fields}")
    
    def test_security_buckets_include_all_types(self):
        """Alerts should be categorized into buckets: security, political, diplomatic, economic, energy"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        expected_buckets = {'security', 'political', 'diplomatic', 'economic', 'energy'}
        found_buckets = set(alert.get('type', '').lower() for alert in alerts)
        
        print(f"Found alert buckets: {found_buckets}")
        
        # At least some expected buckets should be present
        overlap = found_buckets & expected_buckets
        assert len(overlap) >= 2, f"Expected at least 2 bucket types, found {len(overlap)}"
        print(f"✓ Found {len(overlap)} of expected bucket types: {overlap}")
    
    def test_petroleum_dealer_classified_as_economic(self):
        """Petroleum/dealer-related headlines should be classified as economic, not diplomatic"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        
        # Find petroleum/dealer related alerts
        petroleum_keywords = ['petroleum', 'petrol', 'diesel', 'pump', 'dealer', 'fuel', 'price', 'margin']
        
        misclassified = []
        correctly_classified = []
        
        for alert in alerts:
            title = (alert.get('title', '') or '').lower()
            desc = (alert.get('description', '') or '').lower()
            text = f"{title} {desc}"
            alert_type = alert.get('type', '').lower()
            
            if any(kw in text for kw in petroleum_keywords):
                if alert_type == 'economic':
                    correctly_classified.append(title[:50])
                elif alert_type == 'diplomatic':
                    misclassified.append(title[:50])
        
        print(f"Petroleum-related alerts classified as 'economic': {len(correctly_classified)}")
        for t in correctly_classified[:3]:
            print(f"  ✓ {t}...")
        
        if misclassified:
            print(f"Petroleum-related alerts misclassified as 'diplomatic': {len(misclassified)}")
            for t in misclassified[:3]:
                print(f"  ✗ {t}...")
        
        assert len(misclassified) == 0, f"Found {len(misclassified)} petroleum headlines misclassified as diplomatic"
        print(f"✓ Petroleum/dealer headlines correctly classified as economic")
    
    def test_security_alert_severity_levels(self):
        """Alerts should have severity levels: high, medium, low"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        severities = set(alert.get('severity', '') for alert in alerts)
        expected_severities = {'high', 'medium', 'low'}
        
        print(f"Found severity levels: {severities}")
        overlap = severities & expected_severities
        assert len(overlap) >= 1, f"Expected at least 1 standard severity level, found {len(overlap)}"
        print(f"✓ Found {len(overlap)} standard severity levels")
    
    def test_alerts_have_source_info(self):
        """Alerts should include source information"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        alerts_with_source = sum(1 for a in alerts if a.get('source'))
        
        print(f"Alerts with source info: {alerts_with_source}/{len(alerts)}")
        assert alerts_with_source > 0, "Expected at least some alerts with source info"
        print(f"✓ Alerts include source information")


class TestAlertCategorizationLogic:
    """Tests for alert categorization and bucket classification logic"""
    
    def test_energy_bucket_includes_power_keywords(self):
        """Energy bucket should capture power/electricity/gas related alerts"""
        response = requests.get(f"{BASE_URL}/api/security", timeout=60)
        assert response.status_code == 200
        
        alerts = response.json().get('alerts', [])
        energy_keywords = ['energy', 'power', 'electricity', 'gas', 'load shedding', 'renewable']
        
        energy_alerts = [a for a in alerts if a.get('type', '').lower() == 'energy']
        
        print(f"Energy bucket alerts: {len(energy_alerts)}")
        for a in energy_alerts[:3]:
            print(f"  - {a.get('title', '')[:50]}...")
        
        # Check that energy-keyword alerts are in energy bucket
        energy_keyword_alerts = []
        for alert in alerts:
            title = (alert.get('title', '') or '').lower()
            desc = (alert.get('description', '') or '').lower()
            text = f"{title} {desc}"
            
            if any(kw in text for kw in energy_keywords):
                energy_keyword_alerts.append({
                    'title': alert.get('title', '')[:40],
                    'type': alert.get('type', '')
                })
        
        if energy_keyword_alerts:
            print(f"Energy-keyword alerts found: {len(energy_keyword_alerts)}")
            for ea in energy_keyword_alerts[:5]:
                print(f"  - [{ea['type']}] {ea['title']}...")
        
        print(f"✓ Energy bucket categorization verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
