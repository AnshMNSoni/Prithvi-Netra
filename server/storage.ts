import {
  type User,
  type InsertUser,
  type CommunityReport,
  type InsertCommunityReport,
  type Simulation,
  type InsertSimulation,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createCommunityReport(report: InsertCommunityReport): Promise<CommunityReport>;
  getCommunityReports(): Promise<CommunityReport[]>;
  upvoteCommunityReport(id: string): Promise<CommunityReport | undefined>;
  
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  getSimulations(): Promise<Simulation[]>;
  getSimulation(id: string): Promise<Simulation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private communityReports: Map<string, CommunityReport>;
  private simulations: Map<string, Simulation>;

  constructor() {
    this.users = new Map();
    this.communityReports = new Map();
    this.simulations = new Map();

    // Seed community reports
    const report1: CommunityReport = {
      id: "report-seed-1",
      category: "Air Quality",
      location: "123 Main St, Downtown",
      description: "Heavy smoke detected near industrial area causing breathing issues.",
      latitude: 40.7306,
      longitude: -73.9352,
      status: "under-review",
      upvotes: 24,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    };
    const report2: CommunityReport = {
      id: "report-seed-2",
      category: "Green Space",
      location: "Central Park Area",
      description: "Request for more benches and shade structures in the park.",
      latitude: 40.7829,
      longitude: -73.9654,
      status: "in-progress",
      upvotes: 15,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    };
    const report3: CommunityReport = {
      id: "report-seed-3",
      category: "Water",
      location: "River Road",
      description: "Water quality concern - unusual color observed in the river.",
      latitude: 40.7061,
      longitude: -73.9969,
      status: "resolved",
      upvotes: 32,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    };

    this.communityReports.set(report1.id, report1);
    this.communityReports.set(report2.id, report2);
    this.communityReports.set(report3.id, report3);

    // Seed scenario simulations
    const sim1: Simulation = {
      id: "sim-seed-1",
      name: "Scenario: Tree Coverage",
      location: "New York",
      interventions: { trees: 20 },
      predictions: {
        airQuality: "-4% improvement",
        vegetation: "+0.160 NDVI",
        temperature: "-0.6°C cooler"
      },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    };
    const sim2: Simulation = {
      id: "sim-seed-2",
      name: "Scenario: Renewable Energy, Water Bodies",
      location: "Ahmedabad",
      interventions: { renewables: 30, water: 10 },
      predictions: {
        airQuality: "-15% improvement (significant)",
        vegetation: "No significant change",
        temperature: "-0.5°C cooler"
      },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    };

    this.simulations.set(sim1.id, sim1);
    this.simulations.set(sim2.id, sim2);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createCommunityReport(insertReport: InsertCommunityReport): Promise<CommunityReport> {
    const id = randomUUID();
    const report: CommunityReport = {
      ...insertReport,
      id,
      latitude: insertReport.latitude ?? null,
      longitude: insertReport.longitude ?? null,
      status: "under-review",
      upvotes: 0,
      createdAt: new Date(),
    };
    this.communityReports.set(id, report);
    return report;
  }

  async getCommunityReports(): Promise<CommunityReport[]> {
    return Array.from(this.communityReports.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async upvoteCommunityReport(id: string): Promise<CommunityReport | undefined> {
    const report = this.communityReports.get(id);
    if (report) {
      report.upvotes += 1;
      this.communityReports.set(id, report);
    }
    return report;
  }

  async createSimulation(insertSimulation: InsertSimulation): Promise<Simulation> {
    const id = randomUUID();
    const simulation: Simulation = {
      ...insertSimulation,
      id,
      predictions: insertSimulation.predictions ?? null,
      createdAt: new Date(),
    };
    this.simulations.set(id, simulation);
    return simulation;
  }

  async getSimulations(): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getSimulation(id: string): Promise<Simulation | undefined> {
    return this.simulations.get(id);
  }
}

export const storage = new MemStorage();
