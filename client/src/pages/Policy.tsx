import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Download, TrendingUp, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DataChart } from "@/components/DataChart";
import { motion } from "framer-motion";

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

export default function Policy() {
  const [generating, setGenerating] = useState(false);
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("current_location") || "New York";
  });
  const [coordinates, setCoordinates] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("current_coordinates");
    return saved ? JSON.parse(saved) : [40.7128, -74.006];
  });
  const [searchInput, setSearchInput] = useState("");
  const { toast } = useToast();

  const { data: metricsData } = useQuery<any>({
    queryKey: [`/api/nasa/metrics?location=${encodeURIComponent(location)}&lat=${coordinates[0]}&lon=${coordinates[1]}`],
  });

  const { data: insightsData } = useQuery({
    queryKey: ["/api/ai/insights", location, metricsData],
    queryFn: async () => {
      if (!metricsData) return null;
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, metrics: metricsData }),
      });
      if (!res.ok) throw new Error("Failed to fetch AI insights");
      return res.json();
    },
    enabled: !!metricsData,
  });

  const { data: historicalAQI = [] } = useQuery<any[]>({
    queryKey: [`/api/nasa/historical?location=${encodeURIComponent(location)}&metric=aqi&months=6`],
  });

  const { data: historicalNDVI = [] } = useQuery<any[]>({
    queryKey: [`/api/nasa/historical?location=${encodeURIComponent(location)}&metric=ndvi&months=6`],
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

  const generateReport = async () => {
    if (!metricsData) {
      toast({
        title: "Error",
        description: "No data available to generate report",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Urban Planning Report - ${location}`,
          data: {
            metrics: metricsData,
            insights: insightsData?.insights || [],
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `urban-planning-report-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Report Generated",
          description: "Your report has been downloaded successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const envHealthScore = metricsData 
    ? Math.max(10, Math.min(100, Math.round(100 - (metricsData.airQuality - 20) * 0.8))) 
    : 75;

  const urbanDevScore = metricsData 
    ? Math.max(10, Math.min(100, Math.round(metricsData.vegetationIndex * 100))) 
    : 65;

  const resourceScore = metricsData 
    ? Math.max(10, Math.min(100, Math.round(100 - Math.abs(metricsData.waterQuality - 7.2) * 30))) 
    : 70;

  const communityWellbeingScore = Math.round((envHealthScore + urbanDevScore) / 2);

  const sustainabilityScore = Math.round((envHealthScore + urbanDevScore + resourceScore + communityWellbeingScore) / 4);

  const metrics = [
    {
      category: "Environmental Health",
      score: envHealthScore,
      status: envHealthScore >= 70 ? "good" : "warning",
      icon: envHealthScore >= 70 ? CheckCircle2 : AlertTriangle,
    },
    {
      category: "Urban Development",
      score: urbanDevScore,
      status: urbanDevScore >= 70 ? "good" : "warning",
      icon: urbanDevScore >= 70 ? CheckCircle2 : AlertTriangle,
    },
    {
      category: "Community Wellbeing",
      score: communityWellbeingScore,
      status: communityWellbeingScore >= 70 ? "good" : "warning",
      icon: communityWellbeingScore >= 70 ? CheckCircle2 : AlertTriangle,
    },
    {
      category: "Resource Management",
      score: resourceScore,
      status: resourceScore >= 70 ? "good" : "warning",
      icon: resourceScore >= 70 ? CheckCircle2 : TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Policy Insights</h1>
              <p className="text-muted-foreground">
                Data-driven recommendations for sustainable urban development
              </p>
            </div>
            <Button
              onClick={generateReport}
              disabled={generating}
              data-testid="button-generate-report"
              className="w-full sm:w-auto justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Download Report"}
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Controls Bar */}
      <div className="border-b border-border bg-card/30 backdrop-blur-md">
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
            <div className="text-sm font-semibold text-muted-foreground font-mono bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
              Location: {location} ({coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)})
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Sustainability Index */}
          <Card className="lg:col-span-2 p-8">
            <h2 className="text-2xl font-bold mb-6">
              Sustainability & Wellbeing Index
            </h2>

            <div className="flex items-center justify-center mb-8">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="relative"
              >
                <div className="h-48 w-48 rounded-full border-8 border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className="text-5xl font-bold text-primary"
                      data-testid="text-sustainability-score"
                    >
                      {sustainabilityScore}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      out of 100
                    </div>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full border-8 border-primary"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${sustainabilityScore}%, 0 ${sustainabilityScore}%)`,
                  }}
                />
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  key={index}
                  className="border border-border rounded-lg p-4"
                  data-testid={`metric-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <metric.icon
                        className={`h-5 w-5 ${
                          metric.status === "good"
                            ? "text-chart-2"
                            : "text-chart-3"
                        }`}
                      />
                      <span className="font-medium">{metric.category}</span>
                    </div>
                    <span className="text-lg font-bold">{metric.score}</span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Key Recommendations */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Key Recommendations
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-chart-2 pl-4">
                <p className="text-sm font-medium mb-1">High Priority</p>
                <p className="text-xs text-muted-foreground">
                  Expand green infrastructure in high-density zones
                </p>
              </div>
              <div className="border-l-4 border-chart-3 pl-4">
                <p className="text-sm font-medium mb-1">Medium Priority</p>
                <p className="text-xs text-muted-foreground">
                  Enhance public transportation connectivity
                </p>
              </div>
              <div className="border-l-4 border-chart-1 pl-4">
                <p className="text-sm font-medium mb-1">Low Priority</p>
                <p className="text-xs text-muted-foreground">
                  Update zoning regulations for mixed-use development
                </p>
              </div>
            </div>
          </Card>

          {/* Comparative Analysis */}
          <Card className="lg:col-span-3 p-6">
            <h2 className="text-2xl font-bold mb-6">
              Scenario Comparison Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Business as Usual
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Air Quality
                      </span>
                      <span className="font-mono">AQI 65</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Green Coverage
                      </span>
                      <span className="font-mono">22%</span>
                    </div>
                    <Progress value={22} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Water Quality
                      </span>
                      <span className="font-mono">6.8 pH</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Energy Efficiency
                      </span>
                      <span className="font-mono">58%</span>
                    </div>
                    <Progress value={58} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  Sustainable Growth Plan
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Air Quality
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">AQI 42</span>
                        <span className="text-xs text-chart-2 font-semibold">
                          -35%
                        </span>
                      </div>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Green Coverage
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">35%</span>
                        <span className="text-xs text-chart-2 font-semibold">
                          +59%
                        </span>
                      </div>
                    </div>
                    <Progress value={35} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Water Quality
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">7.2 pH</span>
                        <span className="text-xs text-chart-2 font-semibold">
                          +6%
                        </span>
                      </div>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Energy Efficiency
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">78%</span>
                        <span className="text-xs text-chart-2 font-semibold">
                          +34%
                        </span>
                      </div>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Historical Trends Charts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-3"
          >
            <DataChart
              title="Air Quality Index (AQI) 6-Month Trend"
              data={historicalAQI}
              dataKey="value"
              color="hsl(var(--chart-1))"
            />
            <DataChart
              title="Vegetation Index (NDVI) 6-Month Trend"
              data={historicalNDVI}
              dataKey="value"
              color="hsl(var(--chart-2))"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
