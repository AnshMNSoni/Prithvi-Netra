import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Insight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

interface AIInsightsPanelProps {
  insights?: Insight[];
  className?: string;
  onApply?: (insight: Insight) => void;
}

const severityColors = {
  low: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  medium: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function AIInsightsPanel({
  insights = [],
  className = "",
  onApply,
}: AIInsightsPanelProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(
    new Set()
  );

  const toggleInsight = (id: string) => {
    setExpandedInsights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Card className={`p-6 ${className}`} data-testid="card-ai-insights">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-md bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">AI Recommendations</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <Collapsible
            key={insight.id}
            open={expandedInsights.has(insight.id)}
            onOpenChange={() => toggleInsight(insight.id)}
          >
            <div
              className="border border-border rounded-lg overflow-hidden hover-elevate"
              data-testid={`insight-${index}`}
            >
              <CollapsibleTrigger className="w-full p-4 flex items-start gap-3 text-left">
                <span className="font-mono text-sm text-muted-foreground mt-0.5">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge
                      className={`${severityColors[insight.severity]} border text-xs`}
                      data-testid={`badge-severity-${insight.severity}`}
                    >
                      {insight.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
                <ChevronRight
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    expandedInsights.has(insight.id) ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-border pt-4 ml-10">
                  <p className="text-sm mb-3">{insight.recommendation}</p>
                  <Button
                    size="sm"
                    data-testid="button-apply-intervention"
                    onClick={() => {
                      if (onApply) onApply(insight);
                    }}
                  >
                    Apply Intervention
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </Card>
  );
}
