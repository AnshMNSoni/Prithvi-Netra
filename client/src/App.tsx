import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import AIPlanner from "@/pages/AIPlanner";
import Community from "@/pages/Community";
import Policy from "@/pages/Policy";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

import { useState, useEffect } from "react";
import { Preloader } from "@/components/Preloader";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/ai-planner" component={AIPlanner} />
      <Route path="/community" component={Community} />
      <Route path="/policy" component={Policy} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {loading ? (
          <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
            <div className="text-center space-y-4">
              <Preloader />
            </div>
          </div>
        ) : (
          <TooltipProvider>
            <div className="min-h-screen flex flex-col bg-background text-foreground">
              <Navbar />
              <main className="flex-1">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
