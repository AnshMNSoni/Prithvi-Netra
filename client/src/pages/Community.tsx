import { CommunityReport } from "@/components/CommunityReport";
import { MapView } from "@/components/MapView";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Clock, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Community() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

  const { data: reports = [] } = useQuery<any[]>({
    queryKey: ["/api/community/reports"],
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/community/reports", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/reports"] });
      setDialogOpen(false);
      setClickedCoords(null);
      toast({
        title: "Report submitted",
        description: "Your community report has been submitted successfully.",
      });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/community/reports/${id}/upvote`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/reports"] });
    },
  });

  const formatTimestamp = (date: Date | string) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffMs = now.getTime() - reportDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  const displayReports: any[] = reports;

  const statusColors = {
    "under-review": "bg-chart-3/10 text-chart-3 border-chart-3/20",
    "in-progress": "bg-chart-1/10 text-chart-1 border-chart-1/20",
    "resolved": "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };

  const mapMarkers = displayReports.map((report: any) => ({
    id: report.id,
    latitude: report.latitude || 40.7128,
    longitude: report.longitude || -74.006,
    category: report.category,
    description: report.description,
    title: report.location,
  }));

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ latitude: lat, longitude: lng });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Hub</h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Crowdsource localized environmental reports, upvote concerns, and help planners prioritize zoning interventions. Click on the map to submit a new report.
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setClickedCoords(null);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-report">
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Report an Issue</h2>
                <CommunityReport 
                  prefilledCoords={clickedCoords}
                  onSubmit={(data) => createReportMutation.mutate(data)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="h-[500px]">
              <MapView 
                markers={mapMarkers}
                onMapClick={handleMapClick}
              />
            </div>
            <div className="p-4 border-t border-border bg-card">
              <p className="text-sm text-muted-foreground">
                Click the map to drop a pin and report an issue at that location, or click markers to view reported issues.
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Recent Reports</h3>
              <div className="space-y-3">
                {displayReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="border border-border rounded-lg p-4 hover-elevate cursor-pointer"
                    data-testid={`report-${report.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {report.category}
                      </Badge>
                      <Badge
                        className={`${
                          statusColors[
                            report.status as keyof typeof statusColors
                          ]
                        } border text-xs`}
                      >
                        {report.status.replace("-", " ")}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium mb-2">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{report.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(report.createdAt)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => upvoteMutation.mutate(report.id)}
                        data-testid={`button-upvote-${report.id}`}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {report.upvotes}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Top Contributors</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                      #{i}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Contributor {i}</p>
                      <p className="text-xs text-muted-foreground">
                        {25 - i * 5} reports
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {100 - i * 10} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
