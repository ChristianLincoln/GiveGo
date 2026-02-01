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
