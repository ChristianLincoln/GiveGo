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
      html: `<div class="user-location-marker"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
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
      const coinIcon = L.divIcon({
        html: `<div class="coin-location-marker"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: "coin-marker-container",
      });

      const marker = L.marker([coin.latitude, coin.longitude], { icon: coinIcon })
        .addTo(mapRef.current!);

      marker.bindPopup(`
        <div class="coin-popup">
          <strong>${(coin.coinValue / 100).toFixed(2)} GBP</strong><br/>
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
