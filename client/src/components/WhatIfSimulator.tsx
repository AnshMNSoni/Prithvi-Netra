import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trees, Building2, Droplet, Zap, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Intervention {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: number;
  enabled: boolean;
  unit: string;
  impact: string;
}

export function WhatIfSimulator({
  className = "",
  onChange,
  location = "New York",
  value,
}: {
  className?: string;
  onChange?: (activeInterventions: Record<string, number>) => void;
  location?: string;
  value?: Record<string, number>;
}) {
  const { toast } = useToast();
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: "trees",
      label: "Tree Coverage",
      icon: <Trees className="h-5 w-5" />,
      value: 20,
      enabled: true,
      unit: "% increase",
      impact: "+0.08 NDVI",
    },
    {
      id: "housing",
      label: "Housing Density",
      icon: <Building2 className="h-5 w-5" />,
      value: 15,
      enabled: false,
      unit: "% increase",
      impact: "+500 units",
    },
    {
      id: "water",
      label: "Water Bodies",
      icon: <Droplet className="h-5 w-5" />,
      value: 10,
      enabled: true,
      unit: "% area",
      impact: "-2°C heat",
    },
    {
      id: "renewables",
      label: "Renewable Energy",
      icon: <Zap className="h-5 w-5" />,
      value: 30,
      enabled: false,
      unit: "% capacity",
      impact: "-15% emissions",
    },
  ]);

  const updateValue = (id: string, value: number) => {
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
  };

  const toggleEnabled = (id: string) => {
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const reset = () => {
    setInterventions((prev) =>
      prev.map((item) => ({ ...item, value: 0, enabled: false }))
    );
    setSimulationResult(null);
  };

  const simulationMutation = useMutation({
    mutationFn: async () => {
      const activeInterventions: Record<string, number> = {};
      interventions.forEach((int) => {
        if (int.enabled) {
          activeInterventions[int.id] = int.value;
        }
      });

      const interventionNames = Object.keys(activeInterventions).map(id => 
        interventions.find(i => i.id === id)?.label || id
      ).join(", ");

      const response = await apiRequest("POST", "/api/simulations", {
        name: `Scenario: ${interventionNames}`,
        location: location,
        interventions: activeInterventions,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Simulation Complete",
        description: "Your scenario has been analyzed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run simulation",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (onChange) {
      const active: Record<string, number> = {};
      interventions.forEach((int) => {
        if (int.enabled) {
          active[int.id] = int.value;
        }
      });
      
      // Prevent infinite rendering loop by comparing next active state with the value prop
      const activeKeys = Object.keys(active);
      const valueKeys = value ? Object.keys(value) : [];
      let isDifferent = activeKeys.length !== valueKeys.length;
      
      if (!isDifferent) {
        for (const key of activeKeys) {
          if (active[key] !== value?.[key]) {
            isDifferent = true;
            break;
          }
        }
      }
      
      if (isDifferent) {
        onChange(active);
      }
    }
  }, [interventions, onChange, value]);

  // Sync with external value updates (e.g. from Apply Intervention)
  useEffect(() => {
    if (value) {
      let hasChange = false;
      const nextInterventions = interventions.map((item) => {
        const hasExternal = value[item.id] !== undefined;
        const targetValue = hasExternal ? value[item.id] : item.value;
        const targetEnabled = hasExternal;
        
        if (item.enabled !== targetEnabled || item.value !== targetValue) {
          hasChange = true;
        }
        
        return {
          ...item,
          enabled: targetEnabled,
          value: targetValue,
        };
      });

      if (hasChange) {
        setInterventions(nextInterventions);
      }
    }
  }, [value]);

  return (
    <Card className={`p-6 ${className}`} data-testid="card-simulator">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">What-If Simulator</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          data-testid="button-reset-simulator"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {interventions.map((intervention) => (
          <div
            key={intervention.id}
            className="border border-border rounded-lg p-4 space-y-3"
            data-testid={`intervention-${intervention.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  {intervention.icon}
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    {intervention.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Impact: {intervention.impact}
                  </p>
                </div>
              </div>
              <Switch
                checked={intervention.enabled}
                onCheckedChange={() => toggleEnabled(intervention.id)}
                data-testid={`switch-${intervention.id}`}
              />
            </div>

            {intervention.enabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Adjustment
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {intervention.value}
                    {intervention.unit}
                  </span>
                </div>
                <Slider
                  value={[intervention.value]}
                  onValueChange={([value]) => updateValue(intervention.id, value)}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid={`slider-${intervention.id}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <Button
          className="w-full"
          onClick={() => simulationMutation.mutate()}
          disabled={simulationMutation.isPending || !interventions.some((i) => i.enabled)}
          data-testid="button-run-simulation"
        >
          {simulationMutation.isPending ? "Running..." : "Run Simulation"}
        </Button>

        {simulationResult && (
          <div className="mt-4 p-4 border border-border rounded-lg bg-card/50">
            <h3 className="font-semibold mb-2">Predicted Impact</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Air Quality Change:</span>
                <span className="font-semibold">{simulationResult.predictions?.airQuality || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vegetation Index:</span>
                <span className="font-semibold">{simulationResult.predictions?.vegetation || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature:</span>
                <span className="font-semibold">{simulationResult.predictions?.temperature || "N/A"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
