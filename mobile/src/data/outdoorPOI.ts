export interface OutdoorPOI {
  id: string;
  name: string;
  category: 'food' | 'cafe' | 'restroom' | 'parking' | 'bike_rack' | 'emergency';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  campus: 'downtown' | 'loyola';
  hours?: string;
  phone?: string;
}

export const outdoorPOIs: OutdoorPOI[] = [
  // Downtown Campus - Food & Cafes
  {
    id: 'poi_food_1',
    name: 'Thai Express',
    category: 'food',
    coordinates: { latitude: 45.49625, longitude: -73.57788 },
    address: '1240 De Maisonneuve Blvd W',
    description: 'Thai cuisine and quick service',
    campus: 'downtown',
    hours: 'Mon-Fri 11am-9pm, Sat 12pm-9pm'
  },
  {
    id: 'poi_cafe_1',
    name: 'Café O Beirut',
    category: 'cafe',
    coordinates: { latitude: 45.49702, longitude: -73.57945 },
    address: '1420 Bishop Street',
    description: 'Middle Eastern café with specialty coffee',
    campus: 'downtown',
    hours: 'Mon-Fri 7am-6pm, Sat 10am-5pm'
  },
  {
    id: 'poi_food_2',
    name: 'Edo Japan',
    category: 'food',
    coordinates: { latitude: 45.49481, longitude: -73.57923 },
    address: '1 Place du Canada',
    description: 'Japanese cuisine and noodles',
    campus: 'downtown',
    hours: 'Mon-Sun 11am-10pm'
  },
  {
    id: 'poi_restroom_1',
    name: 'Public Restroom',
    category: 'restroom',
    coordinates: { latitude: 45.49542, longitude: -73.57821 },
    address: 'Hall Building, Concordia University',
    campus: 'downtown'
  },
  {
    id: 'poi_parking_1',
    name: 'Downtown Parking Garage',
    category: 'parking',
    coordinates: { latitude: 45.49451, longitude: -73.58121 },
    address: '1400 Guy Street',
    description: 'Multi-level underground parking',
    campus: 'downtown',
    hours: '24/7'
  },
  {
    id: 'poi_bike_rack_1',
    name: 'BiXi Station - Bishop Street',
    category: 'bike_rack',
    coordinates: { latitude: 45.49581, longitude: -73.57951 },
    address: 'Bishop Street & De Maisonneuve',
    description: 'Public bike sharing station',
    campus: 'downtown'
  },
  {
    id: 'poi_emergency_1',
    name: 'Emergency Services',
    category: 'emergency',
    coordinates: { latitude: 45.49702, longitude: -73.57801 },
    address: 'Hall Building Entrance',
    description: 'Campus security and emergency phone',
    campus: 'downtown'
  },
  {
    id: 'poi_food_3',
    name: 'Subway',
    category: 'food',
    coordinates: { latitude: 45.49612, longitude: -73.57612 },
    address: '1456 De Maisonneuve Boulevard W',
    description: 'Sandwiches and quick service',
    campus: 'downtown',
    hours: 'Mon-Sun 11am-9pm'
  },

  // Loyola Campus - Food & Cafes
  {
    id: 'poi_food_4',
    name: 'Osmow Shawarma',
    category: 'food',
    coordinates: { latitude: 45.45878, longitude: -73.63859 },
    address: '7271 Sherbrooke Street W',
    description: 'Shawarma and Middle Eastern cuisine',
    campus: 'loyola',
    hours: 'Mon-Fri 11am-10pm, Sat 12pm-10pm'
  },
  {
    id: 'poi_cafe_2',
    name: 'Café Koi',
    category: 'cafe',
    coordinates: { latitude: 45.45832, longitude: -73.63971 },
    address: '7253 Sherbrooke Street W',
    description: 'Coffee and pastries',
    campus: 'loyola',
    hours: 'Mon-Fri 8am-6pm, Sat 9am-5pm'
  },
  {
    id: 'poi_restroom_2',
    name: 'Public Restroom',
    category: 'restroom',
    coordinates: { latitude: 45.45751, longitude: -73.63902 },
    address: 'Student Centre, Concordia University',
    campus: 'loyola'
  },
  {
    id: 'poi_parking_2',
    name: 'Loyola Parking Structure',
    category: 'parking',
    coordinates: { latitude: 45.45701, longitude: -73.63801 },
    address: '7141 Sherbrooke Street W',
    description: 'Campus parking facility',
    campus: 'loyola',
    hours: '24/7'
  },
  {
    id: 'poi_bike_rack_2',
    name: 'BiXi Station - Sherbrooke Street',
    category: 'bike_rack',
    coordinates: { latitude: 45.45801, longitude: -73.64051 },
    address: 'Sherbrooke Street W & Decarie Boulevard',
    description: 'Public bike sharing station',
    campus: 'loyola'
  },
  {
    id: 'poi_emergency_2',
    name: 'Emergency Services',
    category: 'emergency',
    coordinates: { latitude: 45.46002, longitude: -73.64101 },
    address: 'Loyola Campus Main Entrance',
    description: 'Campus security and emergency phone',
    campus: 'loyola'
  },
  {
    id: 'poi_food_5',
    name: 'Mucho Burrito',
    category: 'food',
    coordinates: { latitude: 45.45945, longitude: -73.63912 },
    address: '7269 Sherbrooke Street W',
    description: 'Mexican cuisine - burritos and bowls',
    campus: 'loyola',
    hours: 'Mon-Sun 11am-10pm'
  }
];

export const POI_CATEGORIES = [
  { key: 'food', label: 'Food', icon: 'restaurant' },
  { key: 'cafe', label: 'Café', icon: 'local-cafe' },
  { key: 'restroom', label: 'Restrooms', icon: 'wc' },
  { key: 'parking', label: 'Parking', icon: 'local-parking' },
  { key: 'bike_rack', label: 'Bike Racks', icon: 'two-wheeler' },
  { key: 'water_fountain', label: 'Water', icon: 'water-drop' },
  { key: 'emergency', label: 'Emergency', icon: 'emergency' }
];
