import React from "react";
import { Link } from "wouter";
import { Github, Globe, Heart, Map, Shield, Mail } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import footerLight from "@assets/generated_images/footer_light.png";
import footerDark from "@assets/generated_images/footer_dark.png";

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="relative overflow-hidden w-full bg-card border-t border-border mt-auto" data-testid="footer">
      {/* Content wrapper with relative positioning and z-index to overlay on top of the background image */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-20 md:pb-28">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                PrithviNetra
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering cities with NASA Earth data, AI-driven insights, and community-powered decision-making for a sustainable urban future.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/AnshMNSoni/Prithvi-Netra.git"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="GitHub Repository"
                data-testid="footer-link-github"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-foreground/80">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/ai-planner" className="text-muted-foreground hover:text-primary transition-colors">
                  AI Planner
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">
                  Community Reports
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Policy Insights
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-foreground/80">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground/75" />
                <a href="https://earthdata.nasa.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  NASA EarthData
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground/75" />
                <a href="https://gibs.earthdata.nasa.gov/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  NASA GIBS
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground/75" />
                <a href="https://openaq.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  OpenAQ Platform
                </a>
              </li>
            </ul>
          </div>

          {/* Details & Info */}
          <div className="col-span-2 md:col-span-1 space-y-3 text-sm">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/80">Platform Status</h3>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-muted-foreground font-medium">NASA GIBS Services: Online</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-muted-foreground font-medium">AI Inference Engines: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col lg:m-[40px] sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PrithviNetra. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 fill-destructive text-destructive animate-pulse" />
            <span>for Sustainable Cities</span>
          </div>
        </div>
      </div>

      {/* Stylized Huge Backdrop Branding Image */}
      <div 
        className="absolute mb-[20px] bottom-0 left-1/2 -translate-x-1/2 w-full min-w-[500px] max-w-[1300px] pointer-events-none select-none z-0 translate-y-[28%] md:translate-y-[22%] transition-all duration-700 ease-out opacity-55 dark:opacity-50"
        data-testid="footer-watermark-image"
      >
        <img
          src={theme === "light" ? footerLight : footerDark}
          alt=""
          className={`w-full h-auto object-contain ${
            theme === "light" ? "mix-blend-multiply" : "brightness-110 contrast-125"
          }`}
        />
      </div>
    </footer>
  );
}
