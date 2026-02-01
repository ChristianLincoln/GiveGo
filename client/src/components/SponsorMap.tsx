import { useEffect, useRef } from "react";
import L from "leaflet";

interface Coin {
  id: string;
  latitude: number;
  longitude: number;
  coinValue: number;
  status: string;
  collectedAt?: Date | string | null;
  expiresAt: Date | string;
}

interface SponsorMapProps {
  coins: Coin[];
  onCoinClick?: (coin: Coin) => void;
}

export function SponsorMap({ coins, onCoinClick }: SponsorMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const coinMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [51.5074, -0.1278];
    
    mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 12);

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

    coinMarkersRef.current.forEach((marker) => marker.remove());
    coinMarkersRef.current = [];

    const coinsWithLocation = coins.filter((c) => 
      Number.isFinite(c.latitude) && Number.isFinite(c.longitude)
    );

    coinsWithLocation.forEach((coin) => {
      const valueLabel = (coin.coinValue / 100).toFixed(0);
      
      let markerHtml = "";
      let markerClass = "";
      
      if (coin.status === "placed") {
        markerHtml = `
          <div class="sponsor-coin-marker sponsor-coin-active">
            <div class="sponsor-coin-pulse"></div>
            <div class="sponsor-coin-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span class="sponsor-coin-value">${valueLabel}</span>
          </div>
        `;
        markerClass = "sponsor-marker-active";
      } else if (coin.status === "collected") {
        markerHtml = `
          <div class="sponsor-coin-marker sponsor-coin-collected">
            <div class="sponsor-coin-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span class="sponsor-coin-value">${valueLabel}</span>
          </div>
        `;
        markerClass = "sponsor-marker-collected";
      } else {
        markerHtml = `
          <div class="sponsor-coin-marker sponsor-coin-expired">
            <div class="sponsor-coin-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span class="sponsor-coin-value">${valueLabel}</span>
          </div>
        `;
        markerClass = "sponsor-marker-expired";
      }

      const coinIcon = L.divIcon({
        html: markerHtml,
        iconSize: [40, 50],
        iconAnchor: [20, 45],
        className: markerClass,
      });

      const marker = L.marker([coin.latitude, coin.longitude], { icon: coinIcon })
        .addTo(mapRef.current!);

      const statusLabel = coin.status === "placed" ? "Active" : 
                          coin.status === "collected" ? "Collected" : "Expired";
      const timeInfo = coin.status === "collected" && coin.collectedAt
        ? `Collected: ${new Date(coin.collectedAt).toLocaleString()}`
        : coin.status === "placed"
        ? `Expires: ${new Date(coin.expiresAt).toLocaleString()}`
        : `Expired: ${new Date(coin.expiresAt).toLocaleString()}`;

      marker.bindPopup(`
        <div class="sponsor-popup">
          <div class="sponsor-popup-value">£${(coin.coinValue / 100).toFixed(2)}</div>
          <div class="sponsor-popup-status ${coin.status}">${statusLabel}</div>
          <div class="sponsor-popup-time">${timeInfo}</div>
          <div class="sponsor-popup-bhf">
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="color: #dc2644">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            British Heart Foundation
          </div>
        </div>
      `);

      if (onCoinClick) {
        marker.on("click", () => onCoinClick(coin));
      }

      coinMarkersRef.current.push(marker);
    });

    if (coinsWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        coinsWithLocation.map((c) => [c.latitude, c.longitude] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [coins, onCoinClick]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[360px] rounded-xl overflow-hidden"
      data-testid="sponsor-map"
    />
  );
}
