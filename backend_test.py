"""
Pakistan Intelligence Monitor - Backend API Testing
Tests all backend endpoints for functionality and data integrity
"""
import requests
import sys
import json
from datetime import datetime

class PakistanIntelAPITester:
    def __init__(self, base_url="https://magical-shtern-3.preview.emergentagent.com"):
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
        success = self.test_endpoint("regional-relations", ["data", "updated"])
        if success:
            # Additional validation for regional data
            url = f"{self.base_url}/api/regional-relations"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                regional_data = data.get("data", {})
                countries = regional_data.get("countries", [])
                if not countries:
                    return self.log_result("Regional Relations Countries", False, 
                                        error="No countries data returned")
                else:
                    return self.log_result("Regional Relations Countries", True,
                                        response_data=f"Found {len(countries)} countries")
            except Exception as e:
                return self.log_result("Regional Validation", False, error=str(e))
        return success

    def test_infrastructure(self):
        """Test infrastructure endpoint"""
        success = self.test_endpoint("infrastructure", ["power", "internet", "updated"])
        if success:
            # Additional validation for infrastructure data
            url = f"{self.base_url}/api/infrastructure"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                required_sections = ["power", "internet"]
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

    def test_daily_energy_report(self):
        """Test daily energy report endpoint"""
        return self.test_endpoint("daily-energy-report", ["data", "updated"])

    def test_daily_briefing(self):
        """Test daily briefing endpoint"""
        return self.test_endpoint("daily-briefing", ["briefing", "updated"])

    def test_power_generation(self):
        """Test power generation endpoint"""
        return self.test_endpoint("power-generation", ["data", "updated"])

    def test_energy_payments(self):
        """Test energy payments endpoint"""
        return self.test_endpoint("energy-payments", ["data", "updated"])

    def test_minerals_metals(self):
        """Test minerals and metals endpoint"""
        return self.test_endpoint("minerals-metals", ["data", "updated"])

    def test_psx_data(self):
        """Test Pakistan Stock Exchange data endpoint"""
        return self.test_endpoint("psx-data", ["data", "updated"])

    def test_ws_status(self):
        """Test WebSocket status endpoint"""
        success = self.test_endpoint("ws-status", ["connected_clients", "ws_path", "events"])
        if success:
            # Additional validation for WebSocket status
            url = f"{self.base_url}/api/ws-status"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                
                # Check if connected_clients is a number
                clients = data.get("connected_clients")
                if not isinstance(clients, int) or clients < 0:
                    return self.log_result("WS Status - Client Count", False, 
                                        error=f"Invalid client count: {clients}")
                else:
                    self.log_result("WS Status - Client Count", True, 
                                 response_data=f"Connected clients: {clients}")
                
                # Check if ws_path is correct
                ws_path = data.get("ws_path")
                expected_paths = ["/api/ws/socket.io", "/api/ws/socket.io/"]
                if ws_path not in expected_paths:
                    return self.log_result("WS Status - Path", False, 
                                        error=f"Unexpected WS path: {ws_path}")
                else:
                    self.log_result("WS Status - Path", True)
                
                # Check if events list contains expected events
                events = data.get("events", [])
                expected_events = ["news_update", "security_update", "weather_update", "energy_news_update"]
                missing_events = [event for event in expected_events if event not in events]
                if missing_events:
                    return self.log_result("WS Status - Events", False, 
                                        error=f"Missing events: {missing_events}")
                else:
                    self.log_result("WS Status - Events", True, 
                                 response_data=f"Found events: {events}")
                
                return True
                
            except Exception as e:
                return self.log_result("WS Status Validation", False, error=str(e))
        return success

    def test_lng_news(self):
        """Test LNG news endpoint"""
        success = self.test_endpoint("lng/news", ["news", "updated", "count"])
        if success:
            # Additional validation for LNG news structure
            url = f"{self.base_url}/api/lng/news"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                news_items = data.get("news", [])
                
                # Test 1: Check if LNG news items exist
                if not news_items:
                    return self.log_result("LNG News Data", False, error="No LNG news items returned")
                
                # Test 2: Check LNG news item structure
                news_item = news_items[0]
                required_fields = ["title", "link", "source", "published"]
                missing_fields = [field for field in required_fields if field not in news_item]
                if missing_fields:
                    return self.log_result("LNG News Item Structure", False, 
                                        error=f"Missing fields in LNG news items: {missing_fields}")
                else:
                    self.log_result("LNG News Item Structure", True)
                
                # Test 3: Check LNG-specific sources
                sources = set(item.get("source", "") for item in news_items if item.get("source"))
                lng_sources = ["LNG Prime", "Offshore Energy", "LNG Journal", "LNG Expert", "LNG Industry", "Energy Intel"]
                found_lng_sources = [src for src in lng_sources if any(src.lower() in s.lower() for s in sources)]
                
                if len(found_lng_sources) < 2:
                    self.log_result("LNG News Sources", False, 
                                 error=f"Expected LNG-specific sources, found: {list(sources)}")
                else:
                    self.log_result("LNG News Sources", True, 
                                 response_data=f"Found LNG sources: {found_lng_sources}")
                
                return True
                
            except Exception as e:
                return self.log_result("LNG News Validation", False, error=str(e))
        return success

    def test_lng_data(self):
        """Test LNG data endpoint"""
        success = self.test_endpoint("lng/data", ["summary", "history", "updated"])
        if success:
            # Additional validation for LNG data structure
            url = f"{self.base_url}/api/lng/data"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                summary = data.get("summary", {})
                history = data.get("history", {})
                
                # Test 1: Check if summary contains expected metrics
                expected_metrics = ["import_payment", "brent_avg", "import_volume", "power_generation", 
                                  "cargo_distribution", "lng_price", "des_slope", "contract_volume"]
                missing_metrics = [metric for metric in expected_metrics if metric not in summary]
                if missing_metrics:
                    return self.log_result("LNG Data Summary Metrics", False, 
                                        error=f"Missing metrics in summary: {missing_metrics}")
                else:
                    self.log_result("LNG Data Summary Metrics", True, 
                                 response_data=f"Found all {len(expected_metrics)} metrics")
                
                # Test 2: Check if history contains expected data tables
                expected_tables = ["power_gen", "information", "port_price"]
                missing_tables = [table for table in expected_tables if table not in history]
                if missing_tables:
                    return self.log_result("LNG Data History Tables", False, 
                                        error=f"Missing history tables: {missing_tables}")
                else:
                    self.log_result("LNG Data History Tables", True, 
                                 response_data=f"Found all {len(expected_tables)} history tables")
                
                # Test 3: Check if summary metrics have proper structure
                if summary.get("import_payment"):
                    metric = summary["import_payment"]
                    required_fields = ["value", "date", "unit"]
                    missing_fields = [field for field in required_fields if field not in metric]
                    if missing_fields:
                        return self.log_result("LNG Metric Structure", False, 
                                            error=f"Missing fields in metric: {missing_fields}")
                    else:
                        self.log_result("LNG Metric Structure", True)
                
                return True
                
            except Exception as e:
                return self.log_result("LNG Data Validation", False, error=str(e))
        return success

    def test_lng_terminals(self):
        """Test LNG terminals endpoint"""
        success = self.test_endpoint("lng/terminals", ["terminals"])
        if success:
            # Additional validation for LNG terminals structure
            url = f"{self.base_url}/api/lng/terminals"
            try:
                response = requests.get(url, timeout=10)
                data = response.json()
                terminals = data.get("terminals", [])
                
                # Test 1: Check if terminals exist
                if not terminals:
                    return self.log_result("LNG Terminals Data", False, error="No LNG terminals returned")
                
                # Test 2: Check expected number of terminals (should be 3: EETL, PGPCL, and proposed)
                if len(terminals) < 2:
                    return self.log_result("LNG Terminals Count", False, 
                                        error=f"Expected at least 2 terminals, got {len(terminals)}")
                else:
                    self.log_result("LNG Terminals Count", True, 
                                 response_data=f"Found {len(terminals)} terminals")
                
                # Test 3: Check terminal structure
                terminal = terminals[0]
                required_fields = ["name", "lat", "lon", "operator", "location", "status"]
                missing_fields = [field for field in required_fields if field not in terminal]
                if missing_fields:
                    return self.log_result("LNG Terminal Structure", False, 
                                        error=f"Missing fields in terminal: {missing_fields}")
                else:
                    self.log_result("LNG Terminal Structure", True)
                
                # Test 4: Check if terminals are in Port Qasim area (lat ~24.8, lon ~67.3)
                port_qasim_terminals = [t for t in terminals if 24.7 <= t.get("lat", 0) <= 25.2 and 67.2 <= t.get("lon", 0) <= 67.5]
                if len(port_qasim_terminals) < 2:
                    return self.log_result("LNG Terminals Location", False, 
                                        error=f"Expected terminals in Port Qasim area, found {len(port_qasim_terminals)}")
                else:
                    self.log_result("LNG Terminals Location", True, 
                                 response_data=f"Found {len(port_qasim_terminals)} terminals in Port Qasim area")
                
                # Test 5: Check for expected terminal names (EETL, PGPCL)
                terminal_names = [t.get("name", "").upper() for t in terminals]
                expected_names = ["EETL", "PGPCL"]
                found_names = [name for name in expected_names if any(name in tn for tn in terminal_names)]
                if len(found_names) < 2:
                    return self.log_result("LNG Terminal Names", False, 
                                        error=f"Expected EETL and PGPCL terminals, found: {terminal_names}")
                else:
                    self.log_result("LNG Terminal Names", True, 
                                 response_data=f"Found expected terminals: {found_names}")
                
                return True
                
            except Exception as e:
                return self.log_result("LNG Terminals Validation", False, error=str(e))
        return success

def main():
    print("🇵🇰 Pakistan Intelligence Monitor - Backend API Testing")
    print("=" * 60)
    
    tester = PakistanIntelAPITester()
    
    # Test all endpoints
    print("\n📡 Testing API Endpoints...")
    tester.test_health()
    tester.test_ws_status()  # Test WebSocket status endpoint
    tester.test_news()
    tester.test_economic()
    tester.test_weather()
    tester.test_security()
    tester.test_regional()
    tester.test_infrastructure()
    tester.test_map_data()
    tester.test_daily_energy_report()
    tester.test_daily_briefing()
    tester.test_power_generation()
    tester.test_energy_payments()
    tester.test_minerals_metals()
    tester.test_psx_data()
    
    # Test new LNG endpoints
    print("\n🔥 Testing LNG Dashboard Endpoints...")
    tester.test_lng_news()
    tester.test_lng_data()
    tester.test_lng_terminals()
    
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