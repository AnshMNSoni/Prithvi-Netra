import React from "react";

export function Preloader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center space-x-2.5 py-4 ${className}`} data-testid="preloader">
      <style>{`
        @keyframes preloader-bounce {
          0%, 80%, 100% { 
            transform: scale(0.6);
            opacity: 0.35;
          } 
          40% { 
            transform: scale(1.15);
            opacity: 1;
            filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.5));
          }
        }
        .preloader-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          animation: preloader-bounce 1.2s infinite ease-in-out both;
        }
        .preloader-dot-1 {
          animation-delay: -0.32s;
        }
        .preloader-dot-2 {
          animation-delay: -0.16s;
        }
      `}</style>
      <div className="preloader-dot preloader-dot-1 bg-primary"></div>
      <div className="preloader-dot preloader-dot-2 bg-primary"></div>
      <div className="preloader-dot bg-primary"></div>
    </div>
  );
}
