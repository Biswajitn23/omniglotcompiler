import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2, Sparkles, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatbotProps {
  code: string;
  language: string;
  error?: string;
  onCodeChange?: (code: string) => void;
}

const AIChatbot = ({ code, language, error, onCodeChange }: AIChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"ask" | "agent">("ask");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: mode === "agent"
            ? `Hi! I'm your AI Agent powered by Gemini. I can directly control your code editor to:\n\n• Write complete code solutions\n• Fix errors automatically\n• Modify and improve your code\n• Run debugging operations\n\nJust tell me what you need and I'll take care of it!`
            : `Hi! I'm your AI coding assistant powered by Gemini. I can help you with:\n\n• Debugging errors\n• Code explanations\n• Code optimization\n• Best practices\n• Algorithm suggestions\n\nHow can I help you today?`,
        },
      ]);
    }
  }, [isOpen, mode]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("API Key present:", !!apiKey);
      
      if (!apiKey || apiKey === "your-gemini-api-key-here") {
        throw new Error("Gemini API key not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash"
      });

      let prompt = "";
      
      if (mode === "agent") {
        prompt = `You are an AI coding agent that can directly write and modify code. You have access to the user's code editor.

Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`
${error ? `\nCurrent Error:\n${error}` : ""}

User Request: ${userMessage}

IMPORTANT: If the user asks you to write, modify, or fix code:
1. Start your response with "AGENT_ACTION:" on a new line
2. Follow with the complete corrected code wrapped in triple backticks with the language
3. After the code, explain what you did

If the user just wants information or explanation, respond normally without AGENT_ACTION.`;
      } else {
        prompt = `You are an expert programming assistant. Here's the context:
Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`
${error ? `\nCurrent Error:\n${error}` : ""}

User Question: ${userMessage}

Provide helpful, concise, and accurate programming advice.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Check if agent mode response contains code action
      if (mode === "agent" && text.includes("AGENT_ACTION:")) {
        const codeMatch = text.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch && onCodeChange) {
          const extractedCode = codeMatch[1].trim();
          onCodeChange(extractedCode);
          
          toast({
            title: "Code Updated!",
            description: "Agent has modified your code.",
          });
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text.replace("AGENT_ACTION:", "").trim() },
      ]);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      let errorMessage = "Sorry, I encountered an error. ";
      
      if (err.message?.includes("API key")) {
        errorMessage += "Please make sure your Gemini API key is configured correctly in the .env file.";
      } else if (err.message?.includes("quota") || err.message?.includes("429")) {
        errorMessage += "API quota exceeded. Please try again later or check your API key limits.";
      } else if (err.message?.includes("blocked")) {
        errorMessage += "The content was blocked by safety filters. Try rephrasing your question.";
      } else {
        errorMessage += `Error: ${err.message || "Unknown error occurred"}`;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg z-50"
          size="icon"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-purple-500/20">
          {/* Header */}
          <div className="flex flex-col border-b bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-semibold">AI Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mode Selector */}
            <div className="px-4 pb-3">
              <Tabs value={mode} onValueChange={(value) => setMode(value as "ask" | "agent")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger 
                    value="ask" 
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-600"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask Mode
                  </TabsTrigger>
                  <TabsTrigger 
                    value="agent" 
                    className="data-[state=active]:bg-white data-[state=active]:text-purple-600"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Agent Mode
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your code..."
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};

export default AIChatbot;
