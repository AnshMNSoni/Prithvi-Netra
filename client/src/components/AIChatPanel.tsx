import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AIChatPanelProps {
  location: string;
  metrics?: {
    airQuality?: number;
    vegetationIndex?: number;
    temperature?: number;
    waterQuality?: number;
  };
  className?: string;
}

export function AIChatPanel({
  location,
  metrics,
  className = "",
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hello! I am your AI Planning Assistant. I can help analyze metrics, simulate interventions, and formulate policies for **${location}**. Ask me any question!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    `How can we lower the heat island effect in ${location}?`,
    `Analyze the current environmental data for ${location}.`,
    `What are the best places for new green infrastructure?`,
  ];

  // Auto-scroll messages
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) setInput("");

    // Add user message to log
    const updatedMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(0, -1), // Send previous messages
          metrics: metrics ? { ...metrics, location } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "model", content: data.response },
        ]);
      } else {
        throw new Error("Failed to connect to AI server");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`flex flex-col h-[600px] border border-border bg-card/40 backdrop-blur-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/60">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Ask Prithvi AI</h3>
          <p className="text-xs text-muted-foreground">Grounded in environmental data</p>
        </div>
      </div>

      {/* Message Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 pr-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 text-sm ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-primary/20 text-primary"
                    : "bg-chart-2/20 text-chart-2"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`p-3 rounded-lg max-w-[80%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-muted-foreground rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-chart-2/20 text-chart-2 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 rounded-lg bg-muted text-muted-foreground rounded-tl-none">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions (only shows when conversation is short) */}
      {messages.length <= 2 && (
        <div className="p-4 border-t border-border bg-card/20 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Suggested Questions:</p>
          <div className="flex flex-col gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-left text-xs bg-muted/50 hover:bg-muted p-2 rounded border border-border text-primary hover-elevate transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Input */}
      <div className="p-4 border-t border-border bg-card/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder={`Ask about urban planning in ${location}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
