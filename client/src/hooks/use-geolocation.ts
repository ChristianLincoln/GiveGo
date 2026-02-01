import { useState, useEffect, useCallback } from 'react';
import { 
  isGeolocationSupported, 
  getCurrentPosition, 
  getGeolocationErrorMessage,
  type GeolocationPosition,
  type GeolocationError 
} from '@/lib/geolocation';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  refresh: () => void;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSupported = isGeolocationSupported();

  const handleSuccess = useCallback((pos: GeolocationPositionObject) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    });
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError({
      code: err.code,
      message: getGeolocationErrorMessage(err.code),
    });
    setIsLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!isSupported) {
      setError({ code: 0, message: 'Geolocation is not supported' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getCurrentPosition()
      .then((pos) => {
        setPosition(pos);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) {
      setError({ code: 0, message: 'Geolocation is not supported by this browser' });
      setIsLoading(false);
      return;
    }

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess as any,
        handleError as any,
        geoOptions
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess as any,
        handleError as any,
        geoOptions
      );
    }
  }, [isSupported, enableHighAccuracy, timeout, maximumAge, watch, handleSuccess, handleError]);

  return {
    position,
    error,
    isLoading,
    isSupported,
    refresh,
  };
}

type GeolocationPositionObject = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
};
