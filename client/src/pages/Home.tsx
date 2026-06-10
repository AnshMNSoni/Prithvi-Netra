import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Satellite,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Leaf,
  Wind,
  Droplet,
  Thermometer,
} from "lucide-react";
import heroImage from "@assets/generated_images/Earth_night_satellite_view_fb2e5b3d.png";

export default function Home() {
  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/stats"],
  });

  const features = [
    {
      icon: <Satellite className="h-6 w-6" />,
      title: "NASA Earth Data",
      description:
        "Real-time satellite observations including Air Quality, NDVI, Temperature, and Land Use data.",
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "AI-Powered Insights",
      description:
        "Machine learning algorithms analyze environmental patterns and provide actionable recommendations.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Predictive Modeling",
      description:
        "What-if simulations to test interventions and forecast environmental impact.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community Engagement",
      description:
        "Crowdsourced reporting and citizen feedback for collaborative urban planning.",
    },
  ];

  const stats = [
    { value: statsData ? String(statsData.citiesCount) : "...", label: "Cities Monitored" },
    { value: statsData ? statsData.dataPointsCount.toLocaleString() : "...", label: "Data Points Analyzed" },
    { value: statsData ? String(statsData.reportsCount) : "...", label: "Community Reports" },
    { value: statsData ? String(statsData.simulationsCount) : "...", label: "Scenarios Simulated" },
  ];

  const metrics = [
    {
      icon: <Wind className="h-5 w-5" />,
      label: "Air Quality",
      color: "text-chart-1",
    },
    {
      icon: <Leaf className="h-5 w-5" />,
      label: "Vegetation",
      color: "text-chart-2",
    },
    {
      icon: <Thermometer className="h-5 w-5" />,
      label: "Temperature",
      color: "text-chart-3",
    },
    {
      icon: <Droplet className="h-5 w-5" />,
      label: "Water Quality",
      color: "text-chart-4",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:h-[70vh] flex items-center justify-center py-20 md:py-0">
        <style>{`
          @keyframes rotate-earth {
            from {
              transform: rotate(0deg) scale(1.2);
            }
            to {
              transform: rotate(360deg) scale(1.2);
            }
          }
        `}</style>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            data-testid="text-hero-title"
          >
            Smart Urban Planning
            <br />
            <span className="text-primary">Powered by NASA</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform cities with real-time Earth observation data, AI-driven
            insights, and community-powered decision making.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" data-testid="button-start-planning">
                Start Planning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-lg bg-background/50 border-border/50"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card/50 backdrop-blur-lg border border-card-border"
              >
                <div className={metric.color}>{metric.icon}</div>
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Urban Analytics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage cutting-edge technology to make data-driven decisions for
            sustainable urban development.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover-elevate transition-all duration-300"
              data-testid={`card-feature-${index}`}
            >
              <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center"
                data-testid={`stat-${index}`}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 container mx-auto px-4">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-chart-2/10 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your City?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join urban planners worldwide using Smart Urban Planner to create
            sustainable, data-driven communities.
          </p>
          <Link href="/dashboard">
            <Button size="lg" data-testid="button-get-started">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
