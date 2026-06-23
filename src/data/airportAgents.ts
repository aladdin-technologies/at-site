export interface AirportAgent {
  airportName: string;
  iataCode: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  agentStatus: "Active" | "Indexing" | "Partial";
  categoriesTracked: number;
  sourceCount: number;
  confidenceScore: number;
}

export const airportAgents: AirportAgent[] = [
  { airportName: "Heathrow", iataCode: "LHR", country: "United Kingdom", region: "Europe", latitude: 51.47, longitude: -0.4543, agentStatus: "Active", categoriesTracked: 174, sourceCount: 7200, confidenceScore: 91 },
  { airportName: "Changi", iataCode: "SIN", country: "Singapore", region: "Asia-Pacific", latitude: 1.3644, longitude: 103.9915, agentStatus: "Active", categoriesTracked: 162, sourceCount: 5800, confidenceScore: 89 },
  { airportName: "Hamad", iataCode: "DOH", country: "Qatar", region: "Middle East", latitude: 25.2731, longitude: 51.6081, agentStatus: "Active", categoriesTracked: 145, sourceCount: 4100, confidenceScore: 82 },
  { airportName: "Schiphol", iataCode: "AMS", country: "Netherlands", region: "Europe", latitude: 52.3105, longitude: 4.7683, agentStatus: "Active", categoriesTracked: 168, sourceCount: 6400, confidenceScore: 88 },
  { airportName: "Frankfurt", iataCode: "FRA", country: "Germany", region: "Europe", latitude: 50.0379, longitude: 8.5622, agentStatus: "Active", categoriesTracked: 171, sourceCount: 6800, confidenceScore: 90 },
  { airportName: "Istanbul", iataCode: "IST", country: "Türkiye", region: "Europe / Middle East", latitude: 41.2753, longitude: 28.7519, agentStatus: "Active", categoriesTracked: 138, sourceCount: 3900, confidenceScore: 79 },
  { airportName: "Incheon", iataCode: "ICN", country: "South Korea", region: "Asia-Pacific", latitude: 37.4602, longitude: 126.4407, agentStatus: "Active", categoriesTracked: 155, sourceCount: 5200, confidenceScore: 85 },
  { airportName: "Hong Kong", iataCode: "HKG", country: "Hong Kong", region: "Asia-Pacific", latitude: 22.308, longitude: 113.9185, agentStatus: "Active", categoriesTracked: 160, sourceCount: 5600, confidenceScore: 87 },
  { airportName: "JFK", iataCode: "JFK", country: "United States", region: "North America", latitude: 40.6413, longitude: -73.7781, agentStatus: "Active", categoriesTracked: 152, sourceCount: 7500, confidenceScore: 86 },
  { airportName: "LAX", iataCode: "LAX", country: "United States", region: "North America", latitude: 33.9416, longitude: -118.4085, agentStatus: "Active", categoriesTracked: 148, sourceCount: 6100, confidenceScore: 84 },
  { airportName: "Paris CDG", iataCode: "CDG", country: "France", region: "Europe", latitude: 49.0097, longitude: 2.5479, agentStatus: "Active", categoriesTracked: 165, sourceCount: 6200, confidenceScore: 88 },
  { airportName: "Sydney", iataCode: "SYD", country: "Australia", region: "Asia-Pacific", latitude: -33.9399, longitude: 151.1753, agentStatus: "Active", categoriesTracked: 142, sourceCount: 4800, confidenceScore: 81 },
  { airportName: "Toronto Pearson", iataCode: "YYZ", country: "Canada", region: "North America", latitude: 43.6777, longitude: -79.6248, agentStatus: "Indexing", categoriesTracked: 130, sourceCount: 3600, confidenceScore: 74 },
  { airportName: "Narita", iataCode: "NRT", country: "Japan", region: "Asia-Pacific", latitude: 35.772, longitude: 140.3929, agentStatus: "Active", categoriesTracked: 150, sourceCount: 5000, confidenceScore: 83 },
  { airportName: "Madrid Barajas", iataCode: "MAD", country: "Spain", region: "Europe", latitude: 40.4983, longitude: -3.5676, agentStatus: "Active", categoriesTracked: 140, sourceCount: 4500, confidenceScore: 80 },
  { airportName: "Rome Fiumicino", iataCode: "FCO", country: "Italy", region: "Europe", latitude: 41.8003, longitude: 12.2389, agentStatus: "Indexing", categoriesTracked: 125, sourceCount: 3200, confidenceScore: 72 },
  { airportName: "Zurich", iataCode: "ZRH", country: "Switzerland", region: "Europe", latitude: 47.4581, longitude: 8.5555, agentStatus: "Active", categoriesTracked: 158, sourceCount: 5400, confidenceScore: 86 },
  { airportName: "Vienna", iataCode: "VIE", country: "Austria", region: "Europe", latitude: 48.1103, longitude: 16.5697, agentStatus: "Partial", categoriesTracked: 98, sourceCount: 2100, confidenceScore: 65 },
  { airportName: "Munich", iataCode: "MUC", country: "Germany", region: "Europe", latitude: 48.3538, longitude: 11.7861, agentStatus: "Active", categoriesTracked: 156, sourceCount: 5100, confidenceScore: 85 },
  { airportName: "Delhi", iataCode: "DEL", country: "India", region: "Asia-Pacific", latitude: 28.5562, longitude: 77.1, agentStatus: "Indexing", categoriesTracked: 115, sourceCount: 2800, confidenceScore: 68 },
  { airportName: "Mumbai", iataCode: "BOM", country: "India", region: "Asia-Pacific", latitude: 19.0896, longitude: 72.8656, agentStatus: "Partial", categoriesTracked: 88, sourceCount: 2200, confidenceScore: 62 },
  { airportName: "Bangkok", iataCode: "BKK", country: "Thailand", region: "Asia-Pacific", latitude: 13.69, longitude: 100.7501, agentStatus: "Active", categoriesTracked: 135, sourceCount: 3800, confidenceScore: 77 },
  { airportName: "Kuala Lumpur", iataCode: "KUL", country: "Malaysia", region: "Asia-Pacific", latitude: 2.7456, longitude: 101.7072, agentStatus: "Indexing", categoriesTracked: 110, sourceCount: 2600, confidenceScore: 70 },
  { airportName: "Melbourne", iataCode: "MEL", country: "Australia", region: "Asia-Pacific", latitude: -37.669, longitude: 144.841, agentStatus: "Active", categoriesTracked: 132, sourceCount: 3400, confidenceScore: 76 },
  { airportName: "Auckland", iataCode: "AKL", country: "New Zealand", region: "Asia-Pacific", latitude: -37.0082, longitude: 174.785, agentStatus: "Partial", categoriesTracked: 78, sourceCount: 1800, confidenceScore: 58 },
];
