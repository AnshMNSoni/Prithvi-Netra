interface EnvironmentalData {
  airQuality: number;
  vegetationIndex: number;
  temperature: number;
  waterQuality: number;
  location: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

interface SimulationPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  impact: string;
}

export class AIService {
  private apiKey = process.env.GROQ_API_KEY || "";
  private model = "llama-3.3-70b-versatile";

  async generateInsights(data: EnvironmentalData): Promise<AIInsight[]> {
    if (!this.apiKey) {
      console.log("No GROQ_API_KEY found, using fallback insights");
      return this.getFallbackInsights(data);
    }

    try {
      const prompt = `As an urban planning AI assistant, analyze this environmental data for ${data.location}:
      
- Air Quality Index: ${data.airQuality} AQI
- Vegetation Index (NDVI): ${data.vegetationIndex}
- Temperature: ${data.temperature}°C
- Water Quality: ${data.waterQuality} pH

Generate 3 specific, actionable recommendations for urban planning improvements. For each recommendation, provide:
1. A clear title
2. Brief description of the issue
3. Severity level (low, medium, or high)
4. Detailed recommendation with estimated costs and expected impact

Respond ONLY with a valid JSON object in this exact format:
{
  "insights": [
    {
      "title": "string",
      "description": "string", 
      "severity": "low|medium|high",
      "recommendation": "string"
    }
  ]
}`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const resBody = await response.json();
      const text = resBody.choices?.[0]?.message?.content;

      if (!text) throw new Error("No response from Groq");

      const parsed = JSON.parse(text.trim());
      const insights = parsed.insights || parsed.recommendations || [];

      return insights.map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        title: insight.title,
        description: insight.description,
        severity: insight.severity || "medium",
        recommendation: insight.recommendation,
      }));
    } catch (error) {
      console.error("Groq API error:", error);
      return this.getFallbackInsights(data);
    }
  }

  async predictImpact(
    currentData: EnvironmentalData,
    interventions: any
  ): Promise<SimulationPrediction[]> {
    const predictions: SimulationPrediction[] = [];

    if (interventions.trees && interventions.trees > 0) {
      const ndviIncrease = interventions.trees * 0.004;
      predictions.push({
        metric: "Vegetation Index",
        currentValue: currentData.vegetationIndex,
        predictedValue: Math.min(1.0, currentData.vegetationIndex + ndviIncrease),
        impact: `+${(ndviIncrease * 100).toFixed(1)}% NDVI improvement`,
      });

      const tempDecrease = interventions.trees * 0.03;
      predictions.push({
        metric: "Temperature",
        currentValue: currentData.temperature,
        predictedValue: currentData.temperature - tempDecrease,
        impact: `-${tempDecrease.toFixed(1)}°C cooling effect`,
      });
    }

    if (interventions.water && interventions.water > 0) {
      const waterImprovement = interventions.water * 0.02;
      predictions.push({
        metric: "Water Quality",
        currentValue: currentData.waterQuality,
        predictedValue: Math.min(8.5, currentData.waterQuality + waterImprovement),
        impact: `+${waterImprovement.toFixed(2)} pH improvement`,
      });
    }

    if (interventions.renewables && interventions.renewables > 0) {
      const aqiImprovement = interventions.renewables * 0.5;
      predictions.push({
        metric: "Air Quality",
        currentValue: currentData.airQuality,
        predictedValue: Math.max(0, currentData.airQuality - aqiImprovement),
        impact: `-${aqiImprovement.toFixed(0)} AQI reduction`,
      });
    }

    return predictions;
  }

  async chat(
    message: string,
    history: { role: "user" | "model"; content: string }[],
    metrics?: EnvironmentalData
  ): Promise<string> {
    if (!this.apiKey) {
      return `[Offline Mode] Here is a mock suggestion for ${metrics?.location || "your location"}. To enable real AI chat, configure GROQ_API_KEY in your .env.`;
    }

    try {
      const messages = [
        {
          role: "system",
          content: "You are Prithvi AI, a smart urban planner assistant. Answer the user's questions about urban design, environmental issues, and zoning policies based on their city's data."
        }
      ];

      // Map history to OpenAI format (Groq uses 'assistant' instead of 'model')
      history.forEach((h) => {
        messages.push({
          role: h.role === "model" ? "assistant" : "user",
          content: h.content,
        });
      });

      let prompt = message;
      if (metrics) {
        prompt = `Current environmental data for ${metrics.location || "selected location"}:
- Air Quality Index: ${metrics.airQuality} AQI
- Vegetation Index (NDVI): ${metrics.vegetationIndex}
- Temperature: ${metrics.temperature}°C
- Water Quality: ${metrics.waterQuality} pH

User Query: ${message}`;
      }

      messages.push({ role: "user", content: prompt });

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq Chat API returned status ${response.status}`);
      }

      const resBody = await response.json();
      return resBody.choices?.[0]?.message?.content || "I couldn't generate a response.";
    } catch (error) {
      console.error("Groq Chat API error:", error);
      return "I'm sorry, I encountered an issue connecting to my brain. How else can I assist with your urban planning?";
    }
  }

  private getFallbackInsights(data: EnvironmentalData): AIInsight[] {
    const insights: AIInsight[] = [];

    if (data.vegetationIndex < 0.5) {
      insights.push({
        id: `insight-${Date.now()}-0`,
        title: "Increase Green Cover in Urban Areas",
        description: "Low vegetation index detected. Urban areas would benefit from increased tree coverage.",
        severity: "high",
        recommendation: "Plant 200+ trees and create 3 new parks. Estimated cost: $500K. Expected NDVI improvement: 0.15 over 2 years.",
      });
    }

    if (data.airQuality > 50) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        title: "Improve Air Quality Monitoring",
        description: "Air quality levels are moderate. Enhanced monitoring and interventions recommended.",
        severity: "medium",
        recommendation: "Install 5 additional air quality sensors. Promote public transit usage. Cost: $50K.",
      });
    }

    if (data.temperature > 30) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        title: "Urban Heat Island Mitigation",
        description: "High temperatures detected. Urban heat island effect may be significant.",
        severity: "high",
        recommendation: "Increase tree canopy coverage by 20%. Install cool roofs. Create water features. Cost: $800K.",
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: `insight-${Date.now()}-0`,
        title: "Maintain Current Environmental Standards",
        description: "Environmental metrics are within acceptable ranges.",
        severity: "low",
        recommendation: "Continue monitoring and maintain current sustainable practices. Regular assessments recommended.",
      });
    }

    return insights;
  }
}

export const aiService = new AIService();
