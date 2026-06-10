import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/components/ThemeProvider";
import { Globe, Compass, Moon, Sun, Layers, Info } from "lucide-react";

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
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const overlaysGroupRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  // Map state UI helpers
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite" | "dark" | "light">(() => {
    return (localStorage.getItem("map_style") as any) || (theme === "dark" ? "dark" : "light");
  });
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);

  // Helper functions for map style configuration
  const getBaseUrl = (style: string) => {
    switch (style) {
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "streets":
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "light":
        return "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
      case "dark":
      default:
        return "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
    }
  };

  const getLabelUrl = (style: string) => {
    switch (style) {
      case "satellite":
      case "light":
        return "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";
      case "streets":
        return ""; // OSM Streets has built-in labels
      case "dark":
      default:
        return "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
    }
  };

  const getAttribution = (style: string) => {
    switch (style) {
      case "satellite":
        return "Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS User Community";
      case "streets":
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    // Add scale bar (critical for GIS layout measurement)
    L.control.scale({ position: "bottomleft" }).addTo(map);

    // Create custom top-level labels pane
    // This allows roads/city text to render above our custom translucent polygons
    const labelsPane = map.createPane("labelsPane");
    labelsPane.style.zIndex = "450";
    labelsPane.style.pointerEvents = "none";

    // Initialize base layer
    const baseLayer = L.tileLayer(getBaseUrl(mapStyle), {
      attribution: getAttribution(mapStyle),
      maxZoom: 19,
    }).addTo(map);
    baseLayerRef.current = baseLayer;

    // Initialize labels layer if applicable
    const labelUrl = getLabelUrl(mapStyle);
    if (labelUrl) {
      const labelsLayer = L.tileLayer(labelUrl, {
        pane: "labelsPane",
        attribution: "",
        maxZoom: 19,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    markersGroupRef.current = L.layerGroup().addTo(map);
    overlaysGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Hover coordinates tracker
    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      setHoverCoords([e.latlng.lat, e.latlng.lng]);
    });

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
      map.off("mousemove");
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer URL when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      baseLayerRef.current.setUrl(getBaseUrl(mapStyle));
      baseLayerRef.current.options.attribution = getAttribution(mapStyle);
    }
    
    // Update labels layer
    const labelUrl = getLabelUrl(mapStyle);
    if (labelUrl) {
      if (labelsLayerRef.current) {
        labelsLayerRef.current.setUrl(labelUrl);
      } else {
        const labelsLayer = L.tileLayer(labelUrl, {
          pane: "labelsPane",
          attribution: "",
          maxZoom: 19,
        }).addTo(map);
        labelsLayerRef.current = labelsLayer;
      }
    } else {
      if (labelsLayerRef.current) {
        labelsLayerRef.current.remove();
        labelsLayerRef.current = null;
      }
    }
    
    localStorage.setItem("map_style", mapStyle);
  }, [mapStyle]);

  // Sync mapStyle with theme changes if currently in basic dark/light style
  useEffect(() => {
    if (mapStyle === "dark" || mapStyle === "light") {
      setMapStyle(theme === "dark" ? "dark" : "light");
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
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; position: relative;">
                 <span style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background-color: white;"></span>
               </div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const popupContent = `
        <div style="font-family: inherit; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
            <h4 style="font-weight: 700; margin: 0; font-size: 13px; color: hsl(var(--foreground)); text-transform: capitalize;">${m.category || "Reported Issue"}</h4>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 11.5px; line-height: 1.4; color: hsl(var(--foreground));">${m.description || ""}</p>
          <div style="font-size: 9.5px; font-weight: 500; color: hsl(var(--muted-foreground)); border-top: 1px solid hsl(var(--border)); padding-top: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span>📍 ${m.title || "Reported Area"}</span>
            <span>(${m.latitude.toFixed(3)}, ${m.longitude.toFixed(3)})</span>
          </div>
        </div>
      `;

      L.marker([m.latitude, m.longitude], { icon: customIcon })
        .bindPopup(popupContent, { closeButton: false, minWidth: 200 })
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
      let statusText = "Good (Low concerns)";
      if (aqi > 100) {
        aqiColor = "hsl(var(--destructive))"; // Critical
        statusText = "Critical (Industrial / Traffic Spikes)";
      } else if (aqi > 50) {
        aqiColor = "hsl(var(--chart-3))"; // Warning
        statusText = "Moderate Concern";
      }

      // Center hotspot
      L.circle(L.latLng(lat, lon), {
        radius: 2000,
        fillColor: aqiColor,
        fillOpacity: 0.16,
        color: aqiColor,
        weight: 1.5,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">City Center AQI Hotspot</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Current Air Quality: <strong style="color: ${aqiColor};">${aqi} AQI</strong> (${statusText})</p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">High traffic and commercial emissions. Planning recommendations focus on zoning restrictions, public transit electrification, and green buffer screens.</p>
          </div>
        `)
        .addTo(overlaysGroup);

      // Nearby place 1: Traffic/Industrial Corridor (North-East)
      L.circle(L.latLng(lat + 0.007, lon + 0.012), {
        radius: 1500,
        fillColor: aqiColor,
        fillOpacity: 0.12,
        color: aqiColor,
        weight: 1.2,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">Industrial Corridor Buffer Zone</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Estimated Air Quality: <strong style="color: ${aqiColor};">${aqi} AQI</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Elevated particulate matter due to freight corridors. Recommended intervention: industrial setbacks and mandatory green canopy buffers.</p>
          </div>
        `)
        .addTo(overlaysGroup);

      // Nearby place 2: Residential Area (South-West)
      L.circle(L.latLng(lat - 0.011, lon - 0.008), {
        radius: 1200,
        fillColor: aqiColor,
        fillOpacity: 0.14,
        color: aqiColor,
        weight: 1.2,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">Residential Buffer AQI Sensor</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Estimated Air Quality: <strong style="color: ${aqiColor};">${Math.round(aqi * 0.85)} AQI</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Moderate household & local transport emissions. Supports neighborhood tree coverage expansions.</p>
          </div>
        `)
        .addTo(overlaysGroup);
    }

    // 2. Vegetation Index Layer (NDVI) - Draw green reserve boundaries
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
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">North-West Nature Reserve</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">NDVI Green Index: <strong style="color: ${ndviColor};">${ndvi.toFixed(2)}</strong> (Healthy Canopy)</p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Critical ecological buffer zone. Protect from residential sprawl and commercial zoning developments.</p>
          </div>
        `)
        .addTo(overlaysGroup);

      // Nearby Park 2: South-East greenbelt
      L.circle(L.latLng(lat - 0.008, lon + 0.014), {
        radius: baseRadius * 0.7,
        fillColor: ndviColor,
        fillOpacity: Math.min(0.2, ndvi * 0.25),
        color: ndviColor,
        weight: 1.5,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">South-East Forest Belt</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">NDVI Green Index: <strong style="color: ${ndviColor};">${(ndvi * 0.75).toFixed(2)}</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Important municipal cooling belt and recreational community forest park.</p>
          </div>
        `)
        .addTo(overlaysGroup);
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
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">Downtown Commercial Heat Pocket</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Estimated Surface Temp: <strong style="color: ${heatColor};">${temp.toFixed(1)}°C</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">High concrete/asphalt ratio causing heat absorption. Recommendations: cool roofs, light-reflecting pavements, and green roof installations.</p>
          </div>
        `)
        .addTo(overlaysGroup);

      // Heat Pocket 2: Residential Density (North-West)
      L.circle(L.latLng(lat + 0.009, lon - 0.006), {
        radius: 1800,
        fillColor: heatColor,
        fillOpacity: opacity * 0.8,
        color: heatColor,
        weight: 1,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">High-Density Residential Heat Pocket</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Estimated Surface Temp: <strong style="color: ${heatColor};">${(temp - 1.8).toFixed(1)}°C</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Caused by compact housing and lack of shade trees. Recommended intervention: street-tree plantation and community pocket parks.</p>
          </div>
        `)
        .addTo(overlaysGroup);
    }

    // 4. Water Layer - Draw nearby water bodies (lakes/rivers)
    if (activeLayers.includes("water")) {
      const waterColor = "hsl(var(--chart-4))";

      // Nearby Lake: West-North-West
      L.circle(L.latLng(lat + 0.005, lon - 0.015), {
        radius: 1200,
        fillColor: waterColor,
        fillOpacity: 0.2,
        color: waterColor,
        weight: 1.5,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">Municipal Lake & Wetland</h4>
            <p style="margin: 0; font-size: 11px; color: hsl(var(--muted-foreground));">Water Quality Index: <strong>Healthy pH 7.4</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Natural runoff collection basin. Critical for urban flood prevention and ecological preservation.</p>
          </div>
        `)
        .addTo(overlaysGroup);

      // River Segment 1
      L.circle(L.latLng(lat - 0.012, lon - 0.003), {
        radius: 700,
        fillColor: waterColor,
        fillOpacity: 0.18,
        color: waterColor,
        weight: 1,
      })
        .bindPopup(`
          <div style="padding: 2px;">
            <h4 style="font-weight: 700; margin-bottom: 4px; font-size: 13px; color: hsl(var(--foreground));">River Stream Segment (Upstream)</h4>
            <p style="margin: 6px 0 0 0; font-size: 10.5px; line-height: 1.3;">Monitored downstream for agricultural runoff control. Recommended shoreline vegetation preservation.</p>
          </div>
        `)
        .addTo(overlaysGroup);
    }

    // 5. Draw Simulation Interventions
    if (simulationInterventions) {
      const { trees, water, housing, renewables } = simulationInterventions;

      // Render extra green canopy circles for trees
      if (trees && trees > 0) {
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
            .bindPopup(`<strong>Simulated Park & Urban Forest</strong><br/>+${trees}% Local Canopy Coverage configured. Cools adjacent blocks by approx 0.8°C.`)
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
          .bindPopup(`<strong>Simulated Water Retention Pond</strong><br/>+${water}% Wetland area. Absorbs localized stormwater surge.`)
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
          .bindPopup(`<strong>Simulated Solar Microgrid</strong><br/>+${renewables}% Renewable Energy grids. Replaces offset emissions from grid dependency.`)
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
    <div className={`relative w-full h-full overflow-hidden select-none border border-border/80 rounded-xl shadow-lg bg-card ${className}`} data-testid="map-container-wrapper">
      {/* Target Container for Leaflet map */}
      <div
        ref={mapRef}
        className="w-full h-full"
        data-testid="map-container"
        style={{ zIndex: 1 }}
      />

      {/* Floating Style Switcher Widget (Top-Right) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={() => setStyleMenuOpen(!styleMenuOpen)}
          className="flex items-center justify-center p-2 rounded-lg bg-card/90 backdrop-blur-md shadow-md border border-border/60 hover-elevate transition-all"
          title="Change Map Style"
          data-testid="map-style-menu-toggle"
        >
          <Layers className="h-4 w-4 text-foreground" />
        </button>

        {styleMenuOpen && (
          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-card/95 backdrop-blur-lg shadow-xl border border-border/70 min-w-[130px] animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase px-1.5 mb-1">Styles</span>
            {[
              { id: "streets", label: "Streets", icon: Compass },
              { id: "satellite", label: "Satellite Hybrid", icon: Globe },
              { id: "dark", label: "Dark Mode", icon: Moon },
              { id: "light", label: "Light Mode", icon: Sun },
            ].map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    setMapStyle(style.id as any);
                    setStyleMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-xs font-semibold transition-colors ${
                    mapStyle === style.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {style.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Interactive GIS Legend (Bottom-Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2 max-w-[280px]">
        {(activeLayers.length > 0 || showPlanningZones) && (
          <div className="p-3.5 rounded-xl bg-card/90 backdrop-blur-md shadow-lg border border-border/60 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-border/40 pb-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">Map Legend</span>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              {activeLayers.includes("aqi") && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                    <span>Air Quality (AQI)</span>
                    <span>Values</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 relative flex justify-between px-2">
                    <span className="text-[8px] text-white -mt-0.5">Good</span>
                    <span className="text-[8px] text-white -mt-0.5">Moderate</span>
                    <span className="text-[8px] text-white -mt-0.5">Poor</span>
                  </div>
                </div>
              )}

              {activeLayers.includes("ndvi") && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                    <span>Vegetation (NDVI)</span>
                    <span>Canopy</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-200 to-emerald-800 relative flex justify-between px-2">
                    <span className="text-[8px] text-black -mt-0.5">Bare</span>
                    <span className="text-[8px] text-white -mt-0.5">Forest</span>
                  </div>
                </div>
              )}

              {activeLayers.includes("temp") && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                    <span>Urban Surface Temp</span>
                    <span>Heat stress</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-600 relative flex justify-between px-2">
                    <span className="text-[8px] text-black -mt-0.5">Mild</span>
                    <span className="text-[8px] text-white -mt-0.5">Hot Spot</span>
                  </div>
                </div>
              )}

              {activeLayers.includes("water") && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-sky-500 opacity-60 border border-sky-600" />
                  <span className="text-[10px] font-medium text-foreground">Municipal Lakes & Wetlands</span>
                </div>
              )}

              {showPlanningZones && (
                <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2 mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">AI Planning Zones</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-4 border border-dashed border-emerald-500 bg-emerald-500/10" />
                    <span className="text-[10.5px] font-medium text-foreground">Zone A: Green Infra Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-4 border border-dashed border-rose-500 bg-rose-500/10" />
                    <span className="text-[10.5px] font-medium text-foreground">Zone B: Critical Heat mitigation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-4 border border-dashed border-blue-500 bg-blue-500/10" />
                    <span className="text-[10.5px] font-medium text-foreground">Zone C: Flood Retention Basin</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating HUD info bar (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-col gap-1 pointer-events-none">
        {hoverCoords && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/85 backdrop-blur-md shadow-md border border-border/60 text-[10px] font-mono font-semibold text-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>Lat: {hoverCoords[0].toFixed(5)}</span>
            <span>Lon: {hoverCoords[1].toFixed(5)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
