import { Card } from "@/components/ui/card";
import { Satellite, Target, Users, Zap } from "lucide-react";

export default function About() {
  const team = [
    {
      name: "Data Science Team",
      role: "AI & Machine Learning",
      description: "Building predictive models for environmental analysis",
    },
    {
      name: "GIS Specialists",
      role: "Geospatial Analysis",
      description: "Processing satellite imagery and spatial data",
    },
    {
      name: "Urban Planners",
      role: "Domain Experts",
      description: "Translating data into actionable insights",
    },
  ];

  const values = [
    {
      icon: <Satellite className="h-6 w-6" />,
      title: "Data-Driven",
      description:
        "Leveraging NASA Earth observations for evidence-based decision making",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Sustainability",
      description:
        "Focused on creating environmentally sustainable urban environments",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Community-First",
      description:
        "Empowering citizens to participate in shaping their cities",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Innovation",
      description:
        "Combining cutting-edge AI with proven urban planning principles",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-br from-primary/10 to-chart-2/10">
        <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
              About Smart Urban Planner
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-center leading-relaxed">
              We're on a mission to transform urban planning through the power
              of NASA Earth Observation data, artificial intelligence, and
              community engagement. Our platform enables cities worldwide to
              make data-driven decisions for a sustainable future.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Mission */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Mission</h2>
          <Card className="p-8 max-w-4xl mx-auto text-center border border-border bg-card hover-elevate">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Smart Urban Planner democratizes access to advanced environmental
              analytics, making NASA's powerful Earth observation capabilities
              accessible to urban planners, city officials, and citizens. By
              combining real-time satellite data with AI-powered insights, we
              help communities visualize environmental challenges, predict
              future scenarios, and implement evidence-based interventions for
              healthier, more sustainable cities.
            </p>
          </Card>
        </section>

        {/* Values */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center flex flex-col items-center hover-elevate">
                <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4 mx-auto">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 hover-elevate">
              <h3 className="text-lg font-semibold mb-4 text-center">Data Sources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span>NASA EarthData & GIBS API</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span>MODIS Vegetation Indices (NDVI)</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span>OpenAQ Air Quality Data</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span>Landsat Surface Temperature</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 hover-elevate">
              <h3 className="text-lg font-semibold mb-4 text-center">Platform</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
                  <span>React & TypeScript Frontend</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
                  <span>OpenAI GPT for AI Insights</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
                  <span>Leaflet Interactive Maps</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2 shrink-0" />
                  <span>Node.js Backend Services</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
