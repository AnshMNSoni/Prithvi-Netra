import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nasaService } from "./services/nasa";
import { aiService } from "./services/groq";
import { insertCommunityReportSchema, insertSimulationSchema } from "@shared/schema";
import jsPDF from "jspdf";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/nasa/metrics", async (req, res) => {
    try {
      const { location, lat, lon } = req.query;
      const metrics = await nasaService.getMetricsForLocation(
        location as string || "New York",
        lat ? parseFloat(lat as string) : undefined,
        lon ? parseFloat(lon as string) : undefined
      );
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/nasa/historical", async (req, res) => {
    try {
      const { location, metric, months } = req.query;
      const data = await nasaService.getHistoricalData(
        location as string || "New York",
        metric as string || "aqi",
        months ? parseInt(months as string) : 6
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/insights", async (req, res) => {
    try {
      const { location, metrics } = req.body;
      const insights = await aiService.generateInsights({
        ...metrics,
        location: location || "Unknown Location",
      });
      res.json({ insights });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/simulate", async (req, res) => {
    try {
      const { location, currentData, interventions } = req.body;
      const predictions = await aiService.predictImpact(currentData, interventions);
      res.json({ predictions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/community/reports", async (req, res) => {
    try {
      const reports = await storage.getCommunityReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/community/reports", async (req, res) => {
    try {
      const validatedData = insertCommunityReportSchema.parse(req.body);
      const report = await storage.createCommunityReport(validatedData);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/community/reports/:id/upvote", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.upvoteCommunityReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/simulations", async (req, res) => {
    try {
      const simulations = await storage.getSimulations();
      res.json(simulations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/simulations", async (req, res) => {
    try {
      const validatedData = insertSimulationSchema.parse(req.body);
      
      const interventions = validatedData.interventions as Record<string, number>;
      const predictions = {
        airQuality: calculateAirQualityImpact(interventions),
        vegetation: calculateVegetationImpact(interventions),
        temperature: calculateTemperatureImpact(interventions),
      };
      
      const simulationWithPredictions = {
        ...validatedData,
        predictions,
      };
      
      const simulation = await storage.createSimulation(simulationWithPredictions);
      res.json(simulation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  function calculateAirQualityImpact(interventions: Record<string, number>): string {
    let impact = 0;
    if (interventions.trees) impact -= interventions.trees * 0.2;
    if (interventions.renewables) impact -= interventions.renewables * 0.15;
    if (interventions.housing) impact += interventions.housing * 0.1;
    
    if (impact < -10) return `${Math.round(impact)}% improvement (significant)`;
    if (impact < 0) return `${Math.round(impact)}% improvement`;
    if (impact > 10) return `${Math.round(impact)}% degradation (concern)`;
    if (impact > 0) return `${Math.round(impact)}% degradation`;
    return "No significant change";
  }

  function calculateVegetationImpact(interventions: Record<string, number>): string {
    let impact = 0;
    if (interventions.trees) impact += interventions.trees * 0.008;
    if (interventions.water) impact += interventions.water * 0.003;
    if (interventions.housing) impact -= interventions.housing * 0.005;
    
    return impact > 0 ? `+${impact.toFixed(3)} NDVI` : `${impact.toFixed(3)} NDVI`;
  }

  function calculateTemperatureImpact(interventions: Record<string, number>): string {
    let impact = 0;
    if (interventions.trees) impact -= interventions.trees * 0.03;
    if (interventions.water) impact -= interventions.water * 0.05;
    if (interventions.housing) impact += interventions.housing * 0.02;
    
    return impact < 0 ? `${impact.toFixed(1)}°C cooler` : `+${impact.toFixed(1)}°C warmer`;
  }

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { title, data } = req.body;
      
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(title || "Urban Planning Report", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
      
      let yPos = 45;
      
      if (data.metrics) {
        doc.setFontSize(14);
        doc.text("Environmental Metrics", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        Object.entries(data.metrics).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 25, yPos);
          yPos += 7;
        });
      }
      
      if (data.insights) {
        yPos += 10;
        doc.setFontSize(14);
        doc.text("AI Recommendations", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        data.insights.forEach((insight: any, index: number) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${index + 1}. ${insight.title}`, 25, yPos);
          yPos += 7;
          const lines = doc.splitTextToSize(insight.recommendation, 160);
          doc.text(lines, 30, yPos);
          yPos += lines.length * 5 + 5;
        });
      }
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=urban-planning-report.pdf');
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, metrics } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const responseText = await aiService.chat(message, history || [], metrics);
      res.json({ response: responseText });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
