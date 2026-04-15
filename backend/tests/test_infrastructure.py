"""
Backend API Tests for Pakistan Intelligence Monitor
Tests for: Infrastructure endpoint (airports, ports), News, and other critical APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected airport data structure
EXPECTED_AIRPORTS = {
    "islamabad": {"code": "ISB", "name": "Islamabad"},
    "karachi": {"code": "KHI", "name": "Karachi"},
    "lahore": {"code": "LHE", "name": "Lahore"},
    "peshawar": {"code": "PEW", "name": "Peshawar"},
    "multan": {"code": "MUX", "name": "Multan"}
}

# Expected port data structure
EXPECTED_PORTS = {
    "karachi": {"name": "Karachi"},
    "qasim": {"name": "Port Qasim"},
    "gwadar": {"name": "Gwadar"}
}


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_200(self):
        """Test that health endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
    def test_health_returns_healthy_status(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data


class TestInfrastructureEndpoint:
    """Infrastructure endpoint tests - airports and ports"""
    
    def test_infrastructure_returns_200(self):
        """Test infrastructure endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        assert response.status_code == 200
    
    def test_infrastructure_has_all_sections(self):
        """Test infrastructure has power, internet, airport_status, port_status"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        assert "power" in data
        assert "internet" in data
        assert "airport_status" in data
        assert "port_status" in data
        assert "updated" in data
    
    # Airport Tests
    def test_all_five_airports_present(self):
        """Test that all 5 airports are present: ISB, KHI, LHE, PEW, MUX"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airports = data["airport_status"]["airports"]
        
        # Check all 5 airports exist
        assert len(airports) == 5, f"Expected 5 airports, got {len(airports)}"
        
        for airport_key in EXPECTED_AIRPORTS.keys():
            assert airport_key in airports, f"Airport {airport_key} not found"
    
    def test_islamabad_airport_data(self):
        """Test Islamabad (ISB) airport data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airport = data["airport_status"]["airports"]["islamabad"]
        assert airport["code"] == "ISB"
        assert airport["name"] == "Islamabad"
        assert "departures" in airport
        assert "arrivals" in airport
        assert "departures_url" in airport
        assert "arrivals_url" in airport
        assert isinstance(airport["departures"], int)
        assert isinstance(airport["arrivals"], int)
    
    def test_karachi_airport_data(self):
        """Test Karachi (KHI) airport data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airport = data["airport_status"]["airports"]["karachi"]
        assert airport["code"] == "KHI"
        assert airport["name"] == "Karachi"
        assert "departures" in airport
        assert "arrivals" in airport
    
    def test_lahore_airport_data(self):
        """Test Lahore (LHE) airport data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airport = data["airport_status"]["airports"]["lahore"]
        assert airport["code"] == "LHE"
        assert airport["name"] == "Lahore"
        assert "departures" in airport
        assert "arrivals" in airport
    
    def test_peshawar_airport_data(self):
        """Test Peshawar (PEW) airport data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airport = data["airport_status"]["airports"]["peshawar"]
        assert airport["code"] == "PEW"
        assert airport["name"] == "Peshawar"
        assert "departures" in airport
        assert "arrivals" in airport
    
    def test_multan_airport_data(self):
        """Test Multan (MUX) airport data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        airport = data["airport_status"]["airports"]["multan"]
        assert airport["code"] == "MUX"
        assert airport["name"] == "Multan"
        assert "departures" in airport
        assert "arrivals" in airport
    
    def test_airport_urls_are_valid(self):
        """Test that airport URLs point to flightstats.com"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        for airport_key, airport in data["airport_status"]["airports"].items():
            code = airport["code"]
            expected_dep_url = f"https://www.flightstats.com/v2/flight-tracker/departures/{code}"
            expected_arr_url = f"https://www.flightstats.com/v2/flight-tracker/arrivals/{code}"
            assert airport["departures_url"] == expected_dep_url, f"Invalid departures URL for {airport_key}"
            assert airport["arrivals_url"] == expected_arr_url, f"Invalid arrivals URL for {airport_key}"
    
    # Port Tests
    def test_all_three_ports_present(self):
        """Test that all 3 ports are present: Karachi, Port Qasim, Gwadar"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        ports = data["port_status"]["ports"]
        
        # Check all 3 ports exist
        assert len(ports) == 3, f"Expected 3 ports, got {len(ports)}"
        
        for port_key in EXPECTED_PORTS.keys():
            assert port_key in ports, f"Port {port_key} not found"
    
    def test_karachi_port_data(self):
        """Test Karachi port data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        port = data["port_status"]["ports"]["karachi"]
        assert port["name"] == "Karachi"
        assert "in_port" in port
        assert "arrivals" in port
        assert "departures" in port
        assert "expected" in port
        assert "url" in port
        assert isinstance(port["in_port"], int)
    
    def test_port_qasim_data(self):
        """Test Port Qasim data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        port = data["port_status"]["ports"]["qasim"]
        assert port["name"] == "Port Qasim"
        assert "in_port" in port
        assert "arrivals" in port
        assert "departures" in port
        assert "expected" in port
    
    def test_gwadar_port_data(self):
        """Test Gwadar port data structure"""
        response = requests.get(f"{BASE_URL}/api/infrastructure")
        data = response.json()
        
        port = data["port_status"]["ports"]["gwadar"]
        assert port["name"] == "Gwadar"
        assert "in_port" in port
        assert "arrivals" in port
        assert "departures" in port
        assert "expected" in port


class TestNewsEndpoint:
    """News endpoint tests"""
    
    def test_news_returns_200(self):
        """Test news endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/news")
        assert response.status_code == 200
    
    def test_news_returns_articles(self):
        """Test news endpoint returns news articles"""
        response = requests.get(f"{BASE_URL}/api/news")
        data = response.json()
        
        assert "news" in data
        assert "count" in data
        assert isinstance(data["news"], list)
        assert data["count"] > 0
    
    def test_news_article_structure(self):
        """Test news article has required fields"""
        response = requests.get(f"{BASE_URL}/api/news")
        data = response.json()
        
        if data["news"]:
            article = data["news"][0]
            assert "title" in article
            assert "link" in article
            assert "source" in article
            assert "category" in article


class TestEconomicEndpoint:
    """Economic endpoint tests - MOCKED API"""
    
    def test_economic_returns_200(self):
        """Test economic endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/economic")
        assert response.status_code == 200
    
    def test_economic_has_indicators(self):
        """Test economic endpoint has key indicators"""
        response = requests.get(f"{BASE_URL}/api/economic")
        data = response.json()
        
        assert "data" in data
        economic_data = data["data"]
        assert "pkr_usd" in economic_data
        assert "psx_kse100" in economic_data


class TestWeatherEndpoint:
    """Weather endpoint tests - MOCKED API"""
    
    def test_weather_returns_200(self):
        """Test weather endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/weather")
        assert response.status_code == 200
    
    def test_weather_has_cities(self):
        """Test weather endpoint returns cities data"""
        response = requests.get(f"{BASE_URL}/api/weather")
        data = response.json()
        
        assert "cities" in data
        assert len(data["cities"]) > 0


class TestSecurityEndpoint:
    """Security endpoint tests - MOCKED API"""
    
    def test_security_returns_200(self):
        """Test security endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/security")
        assert response.status_code == 200
    
    def test_security_has_alerts(self):
        """Test security endpoint returns alerts"""
        response = requests.get(f"{BASE_URL}/api/security")
        data = response.json()
        
        assert "alerts" in data
        assert isinstance(data["alerts"], list)


class TestRegionalEndpoint:
    """Regional relations endpoint tests - MOCKED API"""
    
    def test_regional_returns_200(self):
        """Test regional endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/regional")
        assert response.status_code == 200
    
    def test_regional_has_relations(self):
        """Test regional endpoint has relations data"""
        response = requests.get(f"{BASE_URL}/api/regional")
        data = response.json()
        
        assert "relations" in data


class TestMapDataEndpoint:
    """Map data endpoint tests"""
    
    def test_map_data_returns_200(self):
        """Test map-data endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/map-data")
        assert response.status_code == 200
    
    def test_map_data_has_cities(self):
        """Test map-data endpoint has cities"""
        response = requests.get(f"{BASE_URL}/api/map-data")
        data = response.json()
        
        assert "cities" in data
        assert len(data["cities"]) > 0
