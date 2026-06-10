import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/ThemeProvider";

// Fix Leaflet Default Icon issue in Vite/React builds
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  category?: string;
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: MapMarker[];
  activeLayers?: string[];
  metrics?: {
    airQuality?: number;
    vegetationIndex?: number;
    temperature?: number;
    waterQuality?: number;
  };
  onMapClick?: (lat: number, lng: number) => void;
  simulationInterventions?: {
    trees?: number;
    water?: number;
    housing?: number;
    renewables?: number;
  };
  showPlanningZones?: boolean;
}

export function MapView({
  center = [40.7128, -74.006],
  zoom = 10,
  className = "",
  markers = [],
  activeLayers = [],
  metrics,
  onMapClick,
  simulationInterventions,
  showPlanningZones = false,
}: MapViewProps) {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const overlaysGroupRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    const layer = L.tileLayer(
      theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = layer;
    markersGroupRef.current = L.layerGroup().addTo(map);
    overlaysGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Set up click listener if callback is present
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Update temporary pin marker
      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLatLng(e.latlng);
      } else {
        clickMarkerRef.current = L.marker(e.latlng, {
          icon: L.divIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: hsl(var(--primary)); width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })
        }).addTo(map);
      }

      if (onMapClick) {
        onMapClick(lat, lng);
      }
    });

    return () => {
      map.off("click");
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer URL when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(
        theme === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      );
    }
  }, [theme]);

  // Update center and pan map smoothly when center changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      const currentCenter = map.getCenter();
      const distance = map.distance(currentCenter, L.latLng(center[0], center[1]));
      // Only fly/pan if distance is significant (more than ~10 meters)
      if (distance > 10) {
        map.flyTo(center, zoom, {
          duration: 1.5,
        });
      }
    }
  }, [center, zoom]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    markers.forEach((m) => {
      if (typeof m.latitude !== "number" || typeof m.longitude !== "number") return;
      
      let color = "hsl(var(--primary))";
      if (m.category === "Air Quality" || m.category === "air-quality") color = "hsl(var(--chart-1))";
      else if (m.category === "Green Space" || m.category === "green-space") color = "hsl(var(--chart-2))";
      else if (m.category === "Water" || m.category === "water") color = "hsl(var(--chart-4))";
      else if (m.category === "Noise" || m.category === "noise") color = "hsl(var(--chart-5))";

      const customIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const popupContent = `
        <div style="font-family: inherit; min-width: 150px;">
          <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 14px; color: hsl(var(--foreground));">${m.category || "Reported Issue"}</h4>
          <p style="margin: 0; font-size: 12px; color: hsl(var(--muted-foreground));">${m.description || ""}</p>
          <div style="font-size: 10px; font-weight: 500; margin-top: 6px; color: hsl(var(--muted-foreground));">
            Location: ${m.title || "Coordinates: " + m.latitude.toFixed(4) + ", " + m.longitude.toFixed(4)}
          </div>
        </div>
      `;

      L.marker([m.latitude, m.longitude], { icon: customIcon })
        .bindPopup(popupContent, { closeButton: false })
        .addTo(markersGroup);
    });
  }, [markers]);

  // Update Data Overlays & Simulation Interventions
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlaysGroup = overlaysGroupRef.current;
    if (!map || !overlaysGroup || !metrics) return;

    overlaysGroup.clearLayers();

    const lat = center[0];
    const lon = center[1];

    // 1. Air Quality Layer (AQI) - Draw scattered AQI hotspots
    if (activeLayers.includes("aqi")) {
      const aqi = metrics.airQuality || 50;
      let aqiColor = "hsl(var(--chart-2))"; // Good
      if (aqi > 100) aqiColor = "hsl(var(--destructive))"; // Critical
      else if (aqi > 50) aqiColor = "hsl(var(--chart-3))"; // Warning

      // Center hotspot
      L.circle(L.latLng(lat, lon), {
        radius: 2000,
        fillColor: aqiColor,
        fillOpacity: 0.15,
        color: aqiColor,
        weight: 1.5,
      }).addTo(overlaysGroup);

      // Nearby place 1: Traffic/Industrial Corridor (North-East)
      L.circle(L.latLng(lat + 0.007, lon + 0.012), {
        radius: 1500,
        fillColor: aqiColor,
        fillOpacity: 0.1,
        color: aqiColor,
        weight: 1,
      }).addTo(overlaysGroup);

      // Nearby place 2: Residential Area (South-West)
      L.circle(L.latLng(lat - 0.011, lon - 0.008), {
        radius: 1200,
        fillColor: aqiColor,
        fillOpacity: 0.12,
        color: aqiColor,
        weight: 1,
      }).addTo(overlaysGroup);
    }

    // 2. Vegetation Index Layer (NDVI) - Draw scattered forest/park boundaries
    if (activeLayers.includes("ndvi")) {
      const ndvi = metrics.vegetationIndex || 0.5;
      const ndviColor = "hsl(var(--chart-2))";
      const baseRadius = 1500 + ndvi * 1500;

      // Nearby Park 1: North-West reserve
      L.circle(L.latLng(lat + 0.012, lon - 0.010), {
        radius: baseRadius,
        fillColor: ndviColor,
        fillOpacity: Math.min(0.25, ndvi * 0.3),
        color: ndviColor,
        weight: 1.5,
      }).addTo(overlaysGroup);

      // Nearby Park 2: South-East greenbelt
      L.circle(L.latLng(lat - 0.008, lon + 0.014), {
        radius: baseRadius * 0.7,
        fillColor: ndviColor,
        fillOpacity: Math.min(0.2, ndvi * 0.25),
        color: ndviColor,
        weight: 1.5,
      }).addTo(overlaysGroup);
    }

    // 3. Temperature Layer (Urban Heat Pockets)
    if (activeLayers.includes("temp")) {
      const temp = metrics.temperature || 25;
      const heatColor = "hsl(var(--chart-3))";
      const opacity = Math.max(0.1, Math.min(0.35, (temp - 15) / 35));

      // Heat Pocket 1: Commercial Downtown (South-East)
      L.circle(L.latLng(lat - 0.005, lon + 0.004), {
        radius: 2500,
        fillColor: heatColor,
        fillOpacity: opacity,
        color: heatColor,
        weight: 1,
      }).addTo(overlaysGroup);

      // Heat Pocket 2: Residential Density (North-West)
      L.circle(L.latLng(lat + 0.009, lon - 0.006), {
        radius: 1800,
        fillColor: heatColor,
        fillOpacity: opacity * 0.8,
        color: heatColor,
        weight: 1,
      }).addTo(overlaysGroup);
    }

    // 4. Water Quality Layer - Draw nearby water bodies (lakes/rivers)
    if (activeLayers.includes("water")) {
      const waterColor = "hsl(var(--chart-4))";

      // Nearby Lake: West-North-West
      L.circle(L.latLng(lat + 0.005, lon - 0.015), {
        radius: 1200,
        fillColor: waterColor,
        fillOpacity: 0.2,
        color: waterColor,
        weight: 1.5,
      }).addTo(overlaysGroup);

      // River Segment 1
      L.circle(L.latLng(lat - 0.012, lon - 0.003), {
        radius: 700,
        fillColor: waterColor,
        fillOpacity: 0.18,
        color: waterColor,
        weight: 1,
      }).addTo(overlaysGroup);

      // River Segment 2
      L.circle(L.latLng(lat - 0.015, lon + 0.006), {
        radius: 700,
        fillColor: waterColor,
        fillOpacity: 0.18,
        color: waterColor,
        weight: 1,
      }).addTo(overlaysGroup);
    }

    // 5. Draw Simulation Interventions
    if (simulationInterventions) {
      const { trees, water, housing, renewables } = simulationInterventions;

      // Render extra green canopy circles for trees
      if (trees && trees > 0) {
        // Spread a few smaller green circles around the center
        const positions = [
          [center[0] + 0.008, center[1] + 0.008],
          [center[0] - 0.008, center[1] - 0.008],
          [center[0] + 0.008, center[1] - 0.008],
          [center[0] - 0.008, center[1] + 0.008],
        ];

        positions.slice(0, Math.ceil(trees / 25)).forEach((pos) => {
          L.circle(L.latLng(pos[0], pos[1]), {
            radius: 500 + trees * 10,
            fillColor: "#22c55e",
            fillOpacity: 0.45,
            color: "#16a34a",
            weight: 2,
            dashArray: "4, 4",
          })
            .bindPopup(`Simulated Park: +${trees}% Canopy Cover`)
            .addTo(overlaysGroup);
        });
      }

      // Render extra blue features for water bodies
      if (water && water > 0) {
        L.circle(L.latLng(center[0] + 0.003, center[1] - 0.005), {
          radius: 400 + water * 12,
          fillColor: "#0ea5e9",
          fillOpacity: 0.5,
          color: "#0284c7",
          weight: 2,
        })
          .bindPopup(`Simulated Water Reservoir: +${water}% Wetland`)
          .addTo(overlaysGroup);
      }

      // Render extra orange/yellow markers for renewables
      if (renewables && renewables > 0) {
        L.circle(L.latLng(center[0] - 0.012, center[1] + 0.006), {
          radius: 300 + renewables * 8,
          fillColor: "#eab308",
          fillOpacity: 0.4,
          color: "#ca8a04",
          weight: 1.5,
          dashArray: "3, 3",
        })
          .bindPopup(`Simulated Solar/Wind Farm: +${renewables}% Capacity`)
          .addTo(overlaysGroup);
      }
    }

    // 6. Draw Planning Zone Boundaries
    if (showPlanningZones) {
      const lat = center[0];
      const lon = center[1];

      // Green planning zone (optimal forest zone)
      const greenZoneCoords: L.LatLngTuple[] = [
        [lat + 0.003, lon + 0.003],
        [lat + 0.008, lon + 0.003],
        [lat + 0.008, lon + 0.008],
        [lat + 0.003, lon + 0.008],
      ];
      L.polygon(greenZoneCoords, {
        color: "#22c55e",
        weight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.1,
        dashArray: "5, 5",
      })
        .bindPopup("<b>Zone A: Optimal Green Infrastructure Zone</b><br>AI recommended: Plant 200+ trees here to combat local heat index.")
        .addTo(overlaysGroup);

      // Red planning zone (critical heat island zone)
      const redZoneCoords: L.LatLngTuple[] = [
        [lat - 0.002, lon - 0.002],
        [lat - 0.007, lon - 0.002],
        [lat - 0.007, lon - 0.007],
        [lat - 0.002, lon - 0.007],
      ];
      L.polygon(redZoneCoords, {
        color: "#ef4444",
        weight: 2,
        fillColor: "#ef4444",
        fillOpacity: 0.1,
        dashArray: "5, 5",
      })
        .bindPopup("<b>Zone B: Critical Heat Island Zone</b><br>AI detected: High concrete density. Cool roof solutions recommended.")
        .addTo(overlaysGroup);

      // Blue planning zone (water retention basin)
      const blueZoneCoords: L.LatLngTuple[] = [
        [lat + 0.003, lon - 0.002],
        [lat + 0.008, lon - 0.002],
        [lat + 0.008, lon - 0.007],
        [lat + 0.003, lon - 0.007],
      ];
      L.polygon(blueZoneCoords, {
        color: "#3b82f6",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        dashArray: "5, 5",
      })
        .bindPopup("<b>Zone C: Flood Mitigation Basin</b><br>Zoning recommendation: Restrict heavy construction. Build bio-retention ponds.")
        .addTo(overlaysGroup);
    }
  }, [center, activeLayers, metrics, simulationInterventions, showPlanningZones]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      data-testid="map-container"
      style={{ zIndex: 1 }}
    />
  );
}

