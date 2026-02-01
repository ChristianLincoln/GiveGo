// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Generate a random point within a radius (in km) from a center point
export function generateRandomPointInRadius(
  centerLat: number,
  centerLon: number,
  minRadiusKm: number,
  maxRadiusKm: number
): { latitude: number; longitude: number } {
  const radiusKm = minRadiusKm + Math.random() * (maxRadiusKm - minRadiusKm);
  const radiusDeg = radiusKm / 111; // Approximate conversion (1 degree ≈ 111 km)
  const angle = Math.random() * 2 * Math.PI;

  const latitude = centerLat + radiusDeg * Math.cos(angle);
  const longitude = centerLon + (radiusDeg * Math.sin(angle)) / Math.cos((centerLat * Math.PI) / 180);

  return { latitude, longitude };
}
