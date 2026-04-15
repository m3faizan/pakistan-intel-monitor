"""
Pakistan Intelligence Monitor - Backend API Testing
Tests all backend endpoints for functionality and data integrity
"""
import requests
import sys
import json
from datetime import datetime

class PakistanIntelAPITester:
    def __init__(self, base_url="https://pk-briefing-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = {}
        
    def log_result(self, test_name, success, response_data=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
            self.failed_tests.append({"test": test_name, "error": error})
            
        print(f"{status} - {test_name}")
        if error:
            print(f"   Error: {error}")
            
        self.test_results[test_name] = {
            "success": success,
            "error": error,
            "response_sample": str(response_data)[:200] if response_data else None
        }
        
        return success

    def test_endpoint(self, endpoint, expected_keys=None, method="GET", data=None):
        """Test a single API endpoint"""
        url = f"{self.base_url}/api/{endpoint}"
        test_name = f"API {method} /{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            else:
                return self.log_result(test_name, False, error=f"Unsupported method: {method}")
            
            # Check status code
            if response.status_code != 200:
                return self.log_result(test_name, False, error=f"Status code: {response.status_code}")
            
            # Parse JSON response
            try:
                json_data = response.json()
            except json.JSONDecodeError:
                return self.log_result(test_name, False, error="Invalid JSON response")
            
            # Check expected keys if provided
            if expected_keys:
                for key in expected_keys:
                    if key not in json_data:
                        return self.log_result(test_name, False, error=f"Missing key: {key}")
            
            return self.log_result(test_name, True, json_data)
            
        except requests.exceptions.Timeout:
            return self.log_result(test_name, False, error="Request timeout")
        except requests.exceptions.ConnectionError:
            return self.log_result(test_name, False, error="Connection error")
        except Exception as e:
            return self.log_result(test_name, False, error=str(e))

    def test_health(self):
        """Test health endpoint"""
        return self.test_endpoint("health", ["status", "timestamp", "version"])

    def test_news(self):
        """Test news endpoint with enhanced validation for 100+ items and categories"""
        success = self.test_endpoint("news", ["news", "updated", "count"])
        if success:
            # Additional validation for news structure and enhanced features
            url = f"{self.base_url}/api/news"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                news_items = data.get("news", [])
                
                # Test 1: Check if news items exist
                if not news_items:
                    return self.log_result("News Data", False, error="No news items returned")
                
                # Test 2: Check if we have significant number of news items (should be up to 100)
                news_count = len(news_items)
                if news_count < 20:
                    self.log_result("News Count Check", False, 
                                 error=f"Only {news_count} news items returned, expected more from 20 RSS sources")
                else:
                    self.log_result("News Count Check", True, 
                                 response_data=f"Returned {news_count} news items")
                
                # Test 3: Check news item structure
                news_item = news_items[0]
                required_fields = ["title", "link", "source", "category"]
                missing_fields = [field for field in required_fields if field not in news_item]
                if missing_fields:
                    return self.log_result("News Item Structure", False, 
                                        error=f"Missing fields in news items: {missing_fields}")
                else:
                    self.log_result("News Item Structure", True)
                
                # Test 4: Check category diversity (should have multiple categories)
                categories = set(item.get("category", "") for item in news_items if item.get("category"))
                expected_categories = ["general", "business", "regional", "tech", "sports", "international"]
                found_categories = [cat for cat in expected_categories if cat in categories]
                
                if len(found_categories) < 3:
                    self.log_result("News Categories Diversity", False, 
                                 error=f"Only {len(found_categories)} categories found: {found_categories}. Expected more diversity from multiple source categories")
                else:
                    self.log_result("News Categories Diversity", True, 
                                 response_data=f"Found {len(found_categories)} categories: {found_categories}")
                
                # Test 5: Check RSS source diversity (should have multiple sources from the 20 feeds)
                sources = set(item.get("source", "") for item in news_items if item.get("source"))
                if len(sources) < 5:
                    self.log_result("News Sources Diversity", False, 
                                 error=f"Only {len(sources)} sources found. Expected more from 20 RSS feeds")
                else:
                    self.log_result("News Sources Diversity", True, 
                                 response_data=f"Found {len(sources)} different news sources")
                
                return True
                
            except Exception as e:
                return self.log_result("News Validation", False, error=str(e))
        return success

    def test_economic(self):
        """Test economic endpoint"""
        success = self.test_endpoint("economic", ["data", "updated"])
        if success:
            # Additional validation for economic data structure
            url = f"{self.base_url}/api/economic"
            try:
                response = requests.get(url, timeout=10)
                json_data = response.json()
                econ_data = json_data.get("data", {})
                required_indicators = ["pkr_usd", "psx_kse100", "inflation"]
                missing_indicators = [ind for ind in required_indicators if ind not in econ_data]
                if missing_indicators:
                    return self.log_result("Economic Data Structure", False, 
                                        error=f"Missing indicators: {missing_indicators}")
                else:
                    return self.log_result("Economic Data Structure", True)
            except Exception as e:
                return self.log_result("Economic Validation", False, error=str(e))
        return success

    def test_weather(self):
        """Test weather endpoint"""
        success = self.test_endpoint("weather", ["cities", "updated"])
        if success:
            # Additional validation for weather data
            url = f"{self.base_url}/api/weather"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                cities = data.get("cities", [])
                if not cities:
                    return self.log_result("Weather Cities", False, error="No weather cities returned")
                
                city = cities[0]
                required_fields = ["name", "lat", "lon", "temp", "condition"]
                missing_fields = [field for field in required_fields if field not in city]
                if missing_fields:
                    return self.log_result("Weather City Structure", False, 
                                        error=f"Missing fields: {missing_fields}")
                else:
                    return self.log_result("Weather City Structure", True)
            except Exception as e:
                return self.log_result("Weather Validation", False, error=str(e))
        return success

    def test_security(self):
        """Test security endpoint"""
        success = self.test_endpoint("security", ["alerts", "updated", "count"])
        if success:
            # Additional validation for security alerts
            url = f"{self.base_url}/api/security"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                alerts = data.get("alerts", [])
                if not alerts:
                    return self.log_result("Security Alerts", False, error="No security alerts returned")
                
                alert = alerts[0]
                required_fields = ["type", "severity", "title", "description", "region"]
                missing_fields = [field for field in required_fields if field not in alert]
                if missing_fields:
                    return self.log_result("Security Alert Structure", False, 
                                        error=f"Missing fields: {missing_fields}")
                else:
                    return self.log_result("Security Alert Structure", True)
            except Exception as e:
                return self.log_result("Security Validation", False, error=str(e))
        return success

    def test_regional(self):
        """Test regional relations endpoint"""
        success = self.test_endpoint("regional", ["relations", "updated"])
        if success:
            # Additional validation for regional data
            url = f"{self.base_url}/api/regional"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                relations = data.get("relations", {})
                expected_countries = ["china", "india", "usa"]
                missing_countries = [country for country in expected_countries if country not in relations]
                if missing_countries:
                    return self.log_result("Regional Relations Countries", False, 
                                        error=f"Missing countries: {missing_countries}")
                else:
                    return self.log_result("Regional Relations Countries", True)
            except Exception as e:
                return self.log_result("Regional Validation", False, error=str(e))
        return success

    def test_infrastructure(self):
        """Test infrastructure endpoint"""
        success = self.test_endpoint("infrastructure", ["power", "internet", "transport", "updated"])
        if success:
            # Additional validation for infrastructure data
            url = f"{self.base_url}/api/infrastructure"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                required_sections = ["power", "internet", "transport"]
                missing_sections = [section for section in required_sections if section not in data]
                if missing_sections:
                    return self.log_result("Infrastructure Sections", False, 
                                        error=f"Missing sections: {missing_sections}")
                else:
                    return self.log_result("Infrastructure Sections", True)
            except Exception as e:
                return self.log_result("Infrastructure Validation", False, error=str(e))
        return success

    def test_map_data(self):
        """Test map data endpoint"""
        success = self.test_endpoint("map-data", ["cities", "center", "zoom", "updated"])
        if success:
            # Additional validation for map data
            url = f"{self.base_url}/api/map-data"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                cities = data.get("cities", [])
                if not cities:
                    return self.log_result("Map Cities", False, error="No map cities returned")
                
                city = cities[0]
                required_fields = ["name", "lat", "lon", "type", "population"]
                missing_fields = [field for field in required_fields if field not in city]
                if missing_fields:
                    return self.log_result("Map City Structure", False, 
                                        error=f"Missing fields: {missing_fields}")
                else:
                    return self.log_result("Map City Structure", True)
            except Exception as e:
                return self.log_result("Map Data Validation", False, error=str(e))
        return success

def main():
    print("🇵🇰 Pakistan Intelligence Monitor - Backend API Testing")
    print("=" * 60)
    
    tester = PakistanIntelAPITester()
    
    # Test all endpoints
    print("\n📡 Testing API Endpoints...")
    tester.test_health()
    tester.test_news()
    tester.test_economic()
    tester.test_weather()
    tester.test_security()
    tester.test_regional()
    tester.test_infrastructure()
    tester.test_map_data()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failed in tester.failed_tests:
            print(f"  - {failed['test']}: {failed['error']}")
    
    # Save detailed results to JSON
    results_file = f"/app/backend_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_file, 'w') as f:
        json.dump({
            "summary": {
                "tests_run": tester.tests_run,
                "tests_passed": tester.tests_passed,
                "success_rate": (tester.tests_passed/tester.tests_run)*100,
                "timestamp": datetime.now().isoformat()
            },
            "failed_tests": tester.failed_tests,
            "detailed_results": tester.test_results
        }, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: {results_file}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())