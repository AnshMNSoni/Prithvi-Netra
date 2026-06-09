import { MapView } from "@/components/MapView";
import { MetricCard } from "@/components/MetricCard";
import { DataChart } from "@/components/DataChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Wind,
  Thermometer,
  Droplet,
  Search,
  Layers,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";

const CITY_COORDINATES: Record<string, [number, number]> = {
  "new york": [40.7128, -74.006],
  "london": [51.5074, -0.1278],
  "tokyo": [35.6762, 139.6503],
  "paris": [48.8566, 2.3522],
  "sydney": [-33.8688, 151.2093],
  "mumbai": [19.076, 72.8777],
  "delhi": [28.6139, 77.209],
  "cairo": [30.0444, 31.2357],
  "rio de janeiro": [-22.9068, -43.1729],
  "cape town": [-33.9249, 18.4241],
  "ahmedabad": [23.0225, 72.5714]
};

export default function Dashboard() {
  const [selectedLayers, setSelectedLayers] = useState<string[]>(["aqi"]);
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("current_location") || "New York";
  });
  const [coordinates, setCoordinates] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("current_coordinates");
    return saved ? JSON.parse(saved) : [40.7128, -74.006];
  });
  const [searchInput, setSearchInput] = useState("");

  const { data: metricsData, isLoading: metricsLoading } = useQuery<any>({
    queryKey: [`/api/nasa/metrics?location=${encodeURIComponent(location)}&lat=${coordinates[0]}&lon=${coordinates[1]}`],
    enabled: !!location,
  });

  const { data: chartData } = useQuery<any>({
    queryKey: [`/api/nasa/historical?location=${encodeURIComponent(location)}&metric=aqi&months=6`],
    enabled: !!location,
  });

  const handleSearch = async () => {
    const query = searchInput.trim();
    if (!query) return;

    setLocation(query);
    localStorage.setItem("current_location", query);

    let coords: [number, number] = [40.7128, -74.006];

    // 1. Try local dictionary first
    const key = query.toLowerCase();
    if (CITY_COORDINATES[key]) {
      coords = CITY_COORDINATES[key];
      setCoordinates(coords);
      localStorage.setItem("current_coordinates", JSON.stringify(coords));
      return;
    }

    // 2. Try Nominatim Geocoding API
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: {
          "User-Agent": "Prithvi-Netra-Urban-Planner"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          coords = [lat, lon];
          setCoordinates(coords);
          localStorage.setItem("current_coordinates", JSON.stringify(coords));
          return;
        }
      }
    } catch (e) {
      console.warn("Geocoding API failed, using hash fallback:", e);
    }

    // 3. Fallback: generate pseudo-random coordinates deterministically based on hash
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = query.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = 40.7128 + (hash % 100) / 500;
    const lon = -74.006 + ((hash >> 8) % 100) / 500;
    coords = [lat, lon];
    setCoordinates(coords);
    localStorage.setItem("current_coordinates", JSON.stringify(coords));
  };

  const getStatus = (value: number, metric: string): "good" | "warning" | "critical" => {
    if (metric === "airQuality") {
      if (value <= 50) return "good";
      if (value <= 100) return "warning";
      return "critical";
    }
    if (metric === "vegetationIndex") {
      if (value >= 0.6) return "good";
      if (value >= 0.4) return "warning";
      return "critical";
    }
    if (metric === "temperature") {
      if (value <= 30) return "good";
      if (value <= 35) return "warning";
      return "critical";
    }
    return "good";
  };

  const metrics = metricsData
    ? [
        {
          title: "Air Quality Index",
          value: metricsData.airQuality,
          unit: "AQI",
          icon: Wind,
          status: getStatus(metricsData.airQuality, "airQuality"),
        },
        {
          title: "Vegetation Index",
          value: metricsData.vegetationIndex,
          unit: "NDVI",
          icon: Leaf,
          status: getStatus(metricsData.vegetationIndex, "vegetationIndex"),
        },
        {
          title: "Temperature",
          value: metricsData.temperature,
          unit: "°C",
          icon: Thermometer,
          status: getStatus(metricsData.temperature, "temperature"),
        },
        {
          title: "Water Quality",
          value: metricsData.waterQuality,
          unit: "pH",
          icon: Droplet,
          status: "good" as const,
        },
      ]
    : [];

  const layers = [
    { id: "aqi", label: "Air Quality", color: "bg-chart-1" },
    { id: "ndvi", label: "Vegetation", color: "bg-chart-2" },
    { id: "temp", label: "Temperature", color: "bg-chart-3" },
    { id: "water", label: "Water", color: "bg-chart-4" },
  ];

  const toggleLayer = (layerId: string) => {
    setSelectedLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((id) => id !== layerId)
        : [...prev, layerId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search & Controls Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search location..."
                    className="pl-10"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    data-testid="input-search-location"
                  />
                </div>
                <Button onClick={handleSearch} data-testid="button-search">
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select defaultValue="2024">
                <SelectTrigger className="w-[150px]" data-testid="select-time-range">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-layer-control">
                    <Layers className="h-4 w-4 mr-2" />
                    Layers ({selectedLayers.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm mb-3">Data Layers</h4>
                    {layers.map((layer) => (
                      <label
                        key={layer.id}
                        className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLayers.includes(layer.id)}
                          onChange={() => toggleLayer(layer.id)}
                          className="rounded"
                        />
                        <div className={`h-3 w-3 rounded ${layer.color}`} />
                        <span className="text-sm">{layer.label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="container mx-auto px-4 py-6">
        {metricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="min-h-32 animate-pulse bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        )}
      </div>

      {/* Map & Charts */}
      <div className="container mx-auto px-4 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="h-[500px]">
              <MapView
                center={coordinates}
                activeLayers={selectedLayers}
                metrics={metricsData}
              />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {layers.map((layer) => (
                  <Badge
                    key={layer.id}
                    variant={
                      selectedLayers.includes(layer.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleLayer(layer.id)}
                  >
                    <div className={`h-2 w-2 rounded-full ${layer.color} mr-2`} />
                    {layer.label}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {chartData && chartData.length > 0 ? (
              <DataChart
                title={`Air Quality Trend - ${location}`}
                data={chartData}
                color="hsl(var(--chart-1))"
              />
            ) : (
              <Card className="p-6 h-[365px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading chart data...</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
