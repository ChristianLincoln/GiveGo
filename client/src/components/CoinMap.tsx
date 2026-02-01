import { useEffect, useRef } from "react";
import L from "leaflet";

interface Coin {
  id: string;
  latitude: number;
  longitude: number;
  coinValue: number;
  status: string;
}

interface CoinMapProps {
  userPosition: { latitude: number; longitude: number };
  coins: Coin[];
  onCoinClick?: (coinId: string) => void;
  collectionRadius?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function CoinMap({ 
  userPosition, 
  coins, 
  onCoinClick,
  collectionRadius = 10 
}: CoinMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const coinMarkersRef = useRef<L.Marker[]>([]);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const walkingMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView(
      [userPosition.latitude, userPosition.longitude],
      16
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const userIcon = L.divIcon({
      html: `
        <div class="user-location-marker">
          <div class="user-pulse-ring"></div>
          <div class="user-dot"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: "user-marker-container",
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.latitude, userPosition.longitude]);
    } else {
      userMarkerRef.current = L.marker(
        [userPosition.latitude, userPosition.longitude],
        { icon: userIcon }
      ).addTo(mapRef.current);
      userMarkerRef.current.bindPopup("You are here");
    }

    if (userCircleRef.current) {
      userCircleRef.current.setLatLng([userPosition.latitude, userPosition.longitude]);
    } else {
      userCircleRef.current = L.circle(
        [userPosition.latitude, userPosition.longitude],
        {
          radius: collectionRadius,
          className: "collection-radius-circle",
          fillOpacity: 0.15,
          weight: 2,
        }
      ).addTo(mapRef.current);
    }

    mapRef.current.setView([userPosition.latitude, userPosition.longitude], mapRef.current.getZoom());
  }, [userPosition, collectionRadius]);

  useEffect(() => {
    if (!mapRef.current) return;

    coinMarkersRef.current.forEach((marker) => marker.remove());
    coinMarkersRef.current = [];

    const activeCoins = coins.filter((c) => c.status === "placed");

    activeCoins.forEach((coin) => {
      const valueLabel = coin.coinValue < 100 
        ? `${coin.coinValue}p` 
        : `£${(coin.coinValue / 100).toFixed(0)}`;
      const coinIcon = L.divIcon({
        html: `
          <div class="heart-location-marker">
            <div class="heart-pulse"></div>
            <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="heart-value">${valueLabel}</span>
          </div>
        `,
        iconSize: [48, 60],
        iconAnchor: [24, 54],
        className: "heart-marker-container",
      });

      const marker = L.marker([coin.latitude, coin.longitude], { icon: coinIcon })
        .addTo(mapRef.current!);

      marker.bindPopup(`
        <div class="coin-popup">
          <strong>£${(coin.coinValue / 100).toFixed(2)} Heart</strong><br/>
          <small>Tap to collect when nearby</small>
        </div>
      `);

      if (onCoinClick) {
        marker.on("click", () => onCoinClick(coin.id));
      }

      coinMarkersRef.current.push(marker);
    });

    if (activeCoins.length > 0 && userMarkerRef.current) {
      const bounds = L.latLngBounds([
        [userPosition.latitude, userPosition.longitude],
        ...activeCoins.map((c) => [c.latitude, c.longitude] as [number, number]),
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    // Clear previous route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    walkingMarkersRef.current.forEach((m) => m.remove());
    walkingMarkersRef.current = [];

    // Find nearest heart and draw route
    if (activeCoins.length > 0) {
      let nearestCoin = activeCoins[0];
      let nearestDistance = calculateDistance(
        userPosition.latitude, userPosition.longitude,
        nearestCoin.latitude, nearestCoin.longitude
      );

      activeCoins.forEach((coin) => {
        const distance = calculateDistance(
          userPosition.latitude, userPosition.longitude,
          coin.latitude, coin.longitude
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCoin = coin;
        }
      });

      // Draw dashed route line to nearest heart
      const routeCoords: L.LatLngExpression[] = [
        [userPosition.latitude, userPosition.longitude],
        [nearestCoin.latitude, nearestCoin.longitude]
      ];

      routeLineRef.current = L.polyline(routeCoords, {
        color: 'hsl(346, 81%, 50%)',
        weight: 4,
        opacity: 0.7,
        dashArray: '12, 8',
        lineCap: 'round',
        className: 'walking-route-line'
      }).addTo(mapRef.current);

      // Add walking markers along the route
      const steps = 3;
      for (let i = 1; i <= steps; i++) {
        const ratio = i / (steps + 1);
        const lat = userPosition.latitude + (nearestCoin.latitude - userPosition.latitude) * ratio;
        const lng = userPosition.longitude + (nearestCoin.longitude - userPosition.longitude) * ratio;
        
        const walkIcon = L.divIcon({
          html: `
            <div class="walking-step-marker">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="5" r="2"/>
                <path d="M10 22l4-8-3-2 4-6"/>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          className: 'walking-step-container'
        });

        const marker = L.marker([lat, lng], { icon: walkIcon, interactive: false })
          .addTo(mapRef.current);
        walkingMarkersRef.current.push(marker);
      }

      // Add distance label at midpoint
      const midLat = (userPosition.latitude + nearestCoin.latitude) / 2;
      const midLng = (userPosition.longitude + nearestCoin.longitude) / 2;
      const distanceLabel = nearestDistance < 1000 
        ? `${Math.round(nearestDistance)}m` 
        : `${(nearestDistance / 1000).toFixed(1)}km`;

      const distIcon = L.divIcon({
        html: `<div class="route-distance-label">${distanceLabel}</div>`,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
        className: 'route-distance-container'
      });

      const distMarker = L.marker([midLat, midLng], { icon: distIcon, interactive: false })
        .addTo(mapRef.current);
      walkingMarkersRef.current.push(distMarker);
    }
  }, [coins, onCoinClick, userPosition]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full aspect-video rounded-xl overflow-hidden"
      style={{ minHeight: "250px" }}
      data-testid="coin-map"
    />
  );
}
