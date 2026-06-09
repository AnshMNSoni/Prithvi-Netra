import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { AIChatPanel } from "@/components/AIChatPanel";
import { MapView } from "@/components/MapView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AIPlanner() {
  const [location, setLocation] = useState("New York");
  const [interventions, setInterventions] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const { data: metricsData } = useQuery<any>({
    queryKey: [`/api/nasa/metrics?location=${encodeURIComponent(location)}`],
  });

  const { data: insightsResponse, refetch: refetchInsights } = useQuery<any>({
    queryKey: ["/api/ai/insights", location, metricsData],
    enabled: false,
  });

  useEffect(() => {
    if (metricsData) {
      fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, metrics: metricsData }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("AI Insights:", data);
        })
        .catch((err) => console.error("Error fetching insights:", err));
    }
  }, [metricsData, location]);

  const mockInsights = insightsResponse?.insights || [
    {
      id: "1",
      title: "Increase Green Cover in Zone 3",
      description:
        "Low vegetation index detected in residential zone with high population density.",
      severity: "high" as const,
      recommendation:
        "Plant 200+ trees and create 3 new parks. Estimated cost: $500K. Expected NDVI improvement: 0.15 over 2 years.",
    },
    {
      id: "2",
      title: "Improve Air Quality Monitoring",
      description:
        "Insufficient AQI sensors detected in industrial corridor.",
      severity: "medium" as const,
      recommendation:
        "Install 5 additional air quality sensors. Cost: $50K. Coverage improvement: 85%.",
    },
    {
      id: "3",
      title: "Optimize Water Management",
      description: "Potential flood risk in low-lying areas during monsoon.",
      severity: "low" as const,
      recommendation:
        "Enhance drainage systems and create retention ponds. Cost: $300K.",
    },
  ];

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
              <Button variant="outline" data-testid="button-save-scenario" className="flex-1 sm:flex-initial justify-center">
                <Save className="h-4 w-4 mr-2" />
                Save Scenario
              </Button>
              <Button data-testid="button-share-scenario" className="flex-1 sm:flex-initial justify-center">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto flex-nowrap md:justify-center bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="simulator" data-testid="tab-simulator" className="flex-shrink-0">
              What-If Simulator
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-chat" className="flex-shrink-0">
              Ask Prithvi AI
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights" className="flex-shrink-0">
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="comparison" data-testid="tab-comparison" className="flex-shrink-0">
              Scenario Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <WhatIfSimulator onChange={setInterventions} />
              </div>
              <Card className="lg:col-span-3 p-0 overflow-hidden">
                <div className="h-[350px] md:h-[600px]">
                  <MapView
                    center={[40.7128, -74.006]}
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
                    center={[40.7128, -74.006]}
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
                <AIInsightsPanel insights={mockInsights} />
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
                <h3 className="text-lg font-semibold mb-4">
                  Business as Usual
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Air Quality
                    </span>
                    <span className="font-mono text-sm">AQI 65</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Green Cover
                    </span>
                    <span className="font-mono text-sm">22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Water Quality
                    </span>
                    <span className="font-mono text-sm">6.8 pH</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-primary/50">
                <h3 className="text-lg font-semibold mb-4 text-primary">
                  Sustainable Growth
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Air Quality
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">AQI 42</span>
                      <span className="text-xs text-chart-2">-35%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Green Cover
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">35%</span>
                      <span className="text-xs text-chart-2">+59%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Water Quality
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">7.2 pH</span>
                      <span className="text-xs text-chart-2">+6%</span>
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
