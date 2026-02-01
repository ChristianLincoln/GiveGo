// Geolocation utilities and hooks

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// Check if geolocation is supported
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

// Get current position as a promise
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({ code: 0, message: 'Geolocation is not supported by this browser' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// Get human-readable error message
export function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Location permission was denied. Please enable location access in your browser settings.';
    case 2:
      return 'Unable to determine your location. Please check your device settings.';
    case 3:
      return 'Location request timed out. Please try again.';
    default:
      return 'An unknown error occurred while getting your location.';
  }
}

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

// Generate random point within radius (for testing)
export function generateRandomPointInRadius(
  centerLat: number,
  centerLon: number,
  minRadiusKm: number,
  maxRadiusKm: number
): { latitude: number; longitude: number } {
  const radiusKm = minRadiusKm + Math.random() * (maxRadiusKm - minRadiusKm);
  const radiusDeg = radiusKm / 111; // Approximate conversion
  const angle = Math.random() * 2 * Math.PI;

  const latitude = centerLat + radiusDeg * Math.cos(angle);
  const longitude = centerLon + (radiusDeg * Math.sin(angle)) / Math.cos((centerLat * Math.PI) / 180);

  return { latitude, longitude };
}
