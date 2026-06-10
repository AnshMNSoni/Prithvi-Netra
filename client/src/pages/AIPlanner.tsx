import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { AIChatPanel } from "@/components/AIChatPanel";
import { MapView } from "@/components/MapView";
import { Preloader } from "@/components/Preloader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Share2, Search, SlidersHorizontal, Bot, Sparkles, GitCompare } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FloatingDock } from "@/components/kaif-ui/floating-dock";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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

export default function AIPlanner() {
  const [location, setLocation] = useState(() => {
    return localStorage.getItem("current_location") || "New York";
  });
  const [coordinates, setCoordinates] = useState<[number, number]>(() => {
    const saved = localStorage.getItem("current_coordinates");
    return saved ? JSON.parse(saved) : [40.7128, -74.006];
  });
  const [searchInput, setSearchInput] = useState("");
  const [interventions, setInterventions] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("simulator");
  const { toast } = useToast();

  const { data: metricsData } = useQuery<any>({
    queryKey: [`/api/nasa/metrics?location=${encodeURIComponent(location)}&lat=${coordinates[0]}&lon=${coordinates[1]}`],
  });

  const { data: insightsResponse, isLoading: isLoadingInsights } = useQuery<any>({
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

  const { data: simulations = [] } = useQuery<any[]>({
    queryKey: ["/api/simulations"],
  });

  const latestSim = simulations.find((sim: any) => sim.location.toLowerCase() === location.toLowerCase());

  const activeInterventions = Object.keys(interventions).length > 0
    ? interventions
    : latestSim?.interventions || { trees: 20, renewables: 30, water: 10 };

  const getSimulatedMetrics = () => {
    if (!metricsData) return null;
    
    let aqiDiffPercent = 0;
    if (activeInterventions.trees) aqiDiffPercent -= activeInterventions.trees * 0.2;
    if (activeInterventions.renewables) aqiDiffPercent -= activeInterventions.renewables * 0.15;
    if (activeInterventions.housing) aqiDiffPercent += activeInterventions.housing * 0.1;
    
    let ndviDiff = 0;
    if (activeInterventions.trees) ndviDiff += activeInterventions.trees * 0.008;
    if (activeInterventions.water) ndviDiff += activeInterventions.water * 0.003;
    if (activeInterventions.housing) ndviDiff -= activeInterventions.housing * 0.005;

    let tempDiff = 0;
    if (activeInterventions.trees) tempDiff -= activeInterventions.trees * 0.03;
    if (activeInterventions.water) tempDiff -= activeInterventions.water * 0.05;
    if (activeInterventions.housing) tempDiff += activeInterventions.housing * 0.02;

    const baseAQI = metricsData.airQuality;
    const baseNDVI = metricsData.vegetationIndex;
    const baseTemp = metricsData.temperature;

    const simAQI = Math.max(0, Math.round(baseAQI * (1 + aqiDiffPercent / 100)));
    const simNDVI = Math.min(1.0, Math.max(0, baseNDVI + ndviDiff));
    const simTemp = baseTemp + tempDiff;

    return {
      airQuality: {
        val: simAQI,
        diffPct: aqiDiffPercent,
      },
      vegetation: {
        val: simNDVI,
        diffPct: baseNDVI > 0 ? (ndviDiff / baseNDVI) * 100 : 0,
      },
      temperature: {
        val: simTemp,
        diff: tempDiff,
      }
    };
  };

  const simMetrics = getSimulatedMetrics();
  const insights = insightsResponse?.insights || [];

  const saveScenarioMutation = useMutation({
    mutationFn: async (scenarioName: string) => {
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenarioName,
          location: location,
          interventions: interventions,
        }),
      });
      if (!response.ok) throw new Error("Failed to save scenario");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Scenario Saved",
        description: `Successfully saved "${data.name}"`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save scenario",
        variant: "destructive",
      });
    },
  });

  const handleSaveScenario = () => {
    if (Object.keys(interventions).length === 0) {
      toast({
        title: "No interventions active",
        description: "Please adjust simulator sliders before saving a scenario.",
        variant: "destructive",
      });
      return;
    }
    const name = prompt("Enter a name for this scenario:", `Scenario: ${location} Plan`);
    if (name) {
      saveScenarioMutation.mutate(name);
    }
  };

  const handleShareScenario = () => {
    const activeList = Object.entries(interventions)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(", ");
    
    const textToCopy = `PrithviNetra Urban Scenario for ${location}: ${activeList || "Default Plan"}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Scenario details copied to clipboard. Share it with your team!",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy scenario to clipboard",
          variant: "destructive",
        });
      });
  };

  const handleApplyIntervention = (insight: any) => {
    const title = insight.title.toLowerCase();
    const desc = (insight.recommendation || "").toLowerCase() + " " + (insight.description || "").toLowerCase();
    
    let targetKey = "";
    let val = 25; // default recommendation percentage
    
    const match = desc.match(/(\d+)%/);
    if (match) {
      val = parseInt(match[1]);
    }

    if (title.includes("tree") || title.includes("green") || title.includes("vegetation") || title.includes("canopy") ||
        desc.includes("tree") || desc.includes("green") || desc.includes("park")) {
      targetKey = "trees";
    } else if (title.includes("water") || title.includes("flood") || title.includes("pond") || title.includes("drainage") ||
               desc.includes("water") || desc.includes("flood") || desc.includes("retention")) {
      targetKey = "water";
    } else if (title.includes("renewable") || title.includes("solar") || title.includes("wind") || title.includes("energy") || title.includes("aqi") || title.includes("air") ||
               desc.includes("renewable") || desc.includes("solar") || desc.includes("wind") || desc.includes("aqi") || desc.includes("sensor")) {
      targetKey = "renewables";
    } else if (title.includes("housing") || title.includes("building") || title.includes("density") || title.includes("zoning") ||
               desc.includes("housing") || desc.includes("building") || desc.includes("residential")) {
      targetKey = "housing";
    } else {
      targetKey = "trees";
    }

    setInterventions(prev => ({
      ...prev,
      [targetKey]: val
    }));

    toast({
      title: "Intervention Configured",
      description: `Configured ${targetKey} to ${val}% in the simulator sandbox. Switch to "What-If Simulator" to view it!`,
    });

    setActiveTab("simulator");
  };

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

  // Fallback insights are handled by the server API

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Planning Assistant</h1>
              <p className="text-muted-foreground">
                AI-powered simulations and recommendations for urban development
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                data-testid="button-save-scenario" 
                className="flex-1 sm:flex-initial justify-center"
                onClick={handleSaveScenario}
                disabled={saveScenarioMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
              </Button>
              <Button 
                data-testid="button-share-scenario" 
                className="flex-1 sm:flex-initial justify-center"
                onClick={handleShareScenario}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
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
      <div className="container mx-auto px-4 py-6 pb-36">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-center relative">
            <FloatingDock
              desktopClassName="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000]"
              mobileClassName="fixed bottom-6 right-6 z-[2000]"
              navigationItems={[
                {
                  label: "What-If Simulator",
                  icon: <SlidersHorizontal className="h-full w-full" />,
                  onClick: () => setActiveTab("simulator"),
                  active: activeTab === "simulator",
                },
                {
                  label: "Ask Prithvi AI",
                  icon: <Bot className="h-full w-full" />,
                  onClick: () => setActiveTab("chat"),
                  active: activeTab === "chat",
                },
                {
                  label: "AI Insights",
                  icon: <Sparkles className="h-full w-full" />,
                  onClick: () => setActiveTab("insights"),
                  active: activeTab === "insights",
                },
                {
                  label: "Scenario Comparison",
                  icon: <GitCompare className="h-full w-full" />,
                  onClick: () => setActiveTab("comparison"),
                  active: activeTab === "comparison",
                },
              ]}
            />
          </div>

          <TabsContent value="simulator">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <WhatIfSimulator onChange={setInterventions} location={location} value={interventions} />
              </div>
              <Card className="lg:col-span-3 p-0 overflow-hidden">
                <div className="h-[350px] md:h-[600px]">
                  <MapView
                    center={coordinates}
                    metrics={metricsData}
                    simulationInterventions={interventions}
                    showPlanningZones={true}
                  />
                </div>
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Predicted Impact</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adjust interventions to see changes on the map
                      </p>
                    </div>
                    <Button size="sm" data-testid="button-apply-changes">
                      Apply Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <AIChatPanel location={location} metrics={metricsData} />
              </div>
              <Card className="lg:col-span-3 p-0 overflow-hidden">
                <div className="h-[350px] md:h-[600px]">
                  <MapView
                    center={coordinates}
                    metrics={metricsData}
                    showPlanningZones={true}
                  />
                </div>
                <div className="p-4 border-t border-border bg-card">
                  <p className="text-xs text-muted-foreground">
                    Ask Prithvi AI about urban planning ideas, recommendations, or how to mitigate environmental issues for this city.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {isLoadingInsights ? (
                  <Card className="p-6 flex items-center justify-center min-h-[300px]">
                    <div className="text-center space-y-3">
                      <Preloader />
                      <p className="text-sm text-muted-foreground">Generating AI insights...</p>
                    </div>
                  </Card>
                ) : (
                  <AIInsightsPanel insights={insights} onApply={handleApplyIntervention} />
                )}
              </div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Impact Summary</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-chart-2 pl-4">
                    <p className="text-sm font-medium">Environmental</p>
                    <p className="text-2xl font-bold text-chart-2">+15%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Overall improvement expected
                    </p>
                  </div>
                  <div className="border-l-4 border-chart-3 pl-4">
                    <p className="text-sm font-medium">Cost Estimate</p>
                    <p className="text-2xl font-bold text-chart-3">$850K</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total investment required
                    </p>
                  </div>
                  <div className="border-l-4 border-chart-1 pl-4">
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-2xl font-bold text-chart-1">18 mo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated completion time
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Business as Usual
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Baseline environment metrics for {location}</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Air Quality
                    </span>
                    <span className="font-mono text-sm font-semibold">{metricsData?.airQuality ?? 65} AQI</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Green Cover
                    </span>
                    <span className="font-mono text-sm font-semibold">{(metricsData?.vegetationIndex ?? 0.55).toFixed(2)} NDVI</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Water Quality
                    </span>
                    <span className="font-mono text-sm font-semibold">{metricsData?.waterQuality ?? 6.8} pH</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm text-muted-foreground">
                      Temperature
                    </span>
                    <span className="font-mono text-sm font-semibold">{metricsData?.temperature ?? 22}°C</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-primary/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-primary">
                      Sustainable Plan
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Using {Object.keys(interventions).length > 0 ? "Active Simulator Sandbox" : latestSim ? `Saved Scenario: "${latestSim.name}"` : "Default Sustainable Plan"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Air Quality
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{simMetrics ? simMetrics.airQuality.val : "..."} AQI</span>
                      {simMetrics && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${simMetrics.airQuality.diffPct <= 0 ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"}`}>
                          {simMetrics.airQuality.diffPct > 0 ? "+" : ""}{Math.round(simMetrics.airQuality.diffPct)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Green Cover
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{simMetrics ? simMetrics.vegetation.val.toFixed(2) : "..."} NDVI</span>
                      {simMetrics && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${simMetrics.vegetation.diffPct >= 0 ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"}`}>
                          {simMetrics.vegetation.diffPct > 0 ? "+" : ""}{Math.round(simMetrics.vegetation.diffPct)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground">
                      Water Quality
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{(metricsData?.waterQuality ?? 6.8)} pH</span>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-chart-2/10 text-chart-2">
                        0%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-sm text-muted-foreground">
                      Temperature
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{simMetrics ? simMetrics.temperature.val.toFixed(1) : "..."}°C</span>
                      {simMetrics && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${simMetrics.temperature.diff <= 0 ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"}`}>
                          {simMetrics.temperature.diff > 0 ? "+" : ""}{simMetrics.temperature.diff.toFixed(1)}°C
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
