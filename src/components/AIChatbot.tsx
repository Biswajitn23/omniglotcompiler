import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Loader2, Sparkles, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { callOpenAI } from "@/lib/openai";

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
            ? `Hi! I'm your AI Agent powered by Perplexity AI. I can directly control your code editor to:\n\n• Write complete code solutions\n• Fix errors automatically\n• Modify and improve your code\n• Run debugging operations\n\nJust tell me what you need and I'll take care of it!`
            : `Hi! I'm your AI coding assistant powered by Perplexity AI. I can help you with:\n\n• Debugging errors\n• Code explanations\n• Code optimization\n• Best practices\n• Algorithm suggestions\n\nHow can I help you today?`,
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
      const systemPrompt =
        mode === "agent"
          ? `You are an AI coding agent that can directly write and modify code in the user's editor. When the user needs code changes:
1. Begin with "AGENT_ACTION:" on a new line
2. Provide the COMPLETE updated code inside triple backticks with the language name (e.g., \`\`\`html, \`\`\`python, \`\`\`javascript)
3. Follow the code block with a short explanation of what changed
4. ALWAYS include the full code, not just snippets or partial changes
For informational responses only, skip AGENT_ACTION and answer normally.`
          : `You are an expert programming assistant. Provide concise, accurate technical guidance based on the user's code, language, and errors.`;

      const contextPrompt = `Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`
${error ? `\nCurrent Error:\n${error}` : ""}

User ${mode === "agent" ? "Request" : "Question"}: ${userMessage}`;

      const text = await callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextPrompt },
        ],
        { temperature: mode === "agent" ? 0.2 : 0.5 },
      );

      console.log("AI Response:", text);
      console.log("Mode:", mode);
      console.log("Contains AGENT_ACTION:", text.includes("AGENT_ACTION:"));

      // Check if agent mode response contains code action
      if (mode === "agent") {
        // Try multiple regex patterns to extract code
        let codeMatch = text.match(/```(?:[\w]*)\n([\s\S]*?)```/); // Standard: ```html\ncode```
        if (!codeMatch) {
          codeMatch = text.match(/```([\s\S]*?)```/); // Without language: ```code```
        }
        
        console.log("Code match found:", !!codeMatch);
        console.log("onCodeChange available:", !!onCodeChange);
        
        if (codeMatch && onCodeChange) {
          const extractedCode = codeMatch[1].trim();
          console.log("Extracted code length:", extractedCode.length);
          console.log("First 100 chars:", extractedCode.substring(0, 100));
          onCodeChange(extractedCode);
          
          toast({
            title: "Code Updated!",
            description: `Agent has modified your ${language.toUpperCase()} code.`,
          });
        } else if (!codeMatch) {
          console.warn("No code block found in response. Check if AI is providing code in triple backticks.");
          toast({
            title: "No Code Found",
            description: "The agent didn't provide code in the expected format. Try asking more specifically.",
            variant: "destructive",
          });
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: text.replace("AGENT_ACTION:", "").trim() },
      ]);
    } catch (err: any) {
      console.error("OpenAI API Error:", err);
      let errorMessage = "Sorry, I encountered an error. ";
      
      if (err.message?.includes("API key")) {
        errorMessage += "Please make sure your Perplexity API key is configured correctly in the .env file.";
      } else if (err.message?.includes("quota") || err.message?.includes("429")) {
        errorMessage += "API quota exceeded. Please try again later or check your API key limits at https://www.perplexity.ai/settings/api";
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
