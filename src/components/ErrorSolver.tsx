import { useState } from "react";
import { Wand2, Loader2, CheckCircle2, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "@/hooks/use-toast";

interface ErrorSolverProps {
  code: string;
  language: string;
  error: string;
  onSolutionGenerated: (solution: string, fixedCode?: string) => void;
  onCodeFixed: (fixedCode: string) => void;
}

const ErrorSolver = ({ code, language, error, onSolutionGenerated, onCodeFixed }: ErrorSolverProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [solution, setSolution] = useState<string>("");
  const [fixedCode, setFixedCode] = useState<string>("");

  const analyzeError = async () => {
    if (!error.trim()) {
      toast({
        title: "No Error",
        description: "There's no error to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setSolution("");

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "your-gemini-api-key-here") {
        throw new Error("Gemini API key not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash"
      });

      const prompt = `You are an expert ${language} programmer and debugging assistant. Analyze this error and provide a solution.

Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Error Message:
${error}

Please provide:
1. **Error Explanation**: What caused this error?
2. **Solution**: How to fix it?
3. **Fixed Code**: Provide the corrected version of the code (if applicable)
4. **Prevention Tips**: How to avoid this error in the future?

Format your response clearly with sections.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setSolution(text);
      onSolutionGenerated(text);

      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your error and provided solutions.",
      });
    } catch (err) {
      console.error("Error Analysis Failed:", err);
      toast({
        title: "Error",
        description: "Failed to analyze error. Check your Gemini API key configuration.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoFixCode = async () => {
    if (!error.trim()) {
      toast({
        title: "No Error",
        description: "There's no error to fix.",
        variant: "destructive",
      });
      return;
    }

    setIsFixing(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === "your-gemini-api-key-here") {
        throw new Error("Gemini API key not configured");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash"
      });

      const prompt = `You are an expert ${language} programmer. Fix this code that has an error.

Language: ${language}

Current Code:
\`\`\`${language}
${code}
\`\`\`

Error Message:
${error}

IMPORTANT: Respond ONLY with the fixed code. Do not include any explanations, markdown formatting, or code block markers. Just provide the raw corrected code that can be directly used.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Remove code block markers if present
      text = text.replace(/```[\w]*\n?/g, '').trim();

      setFixedCode(text);
      onCodeFixed(text);

      toast({
        title: "Code Fixed!",
        description: "AI has automatically fixed your code.",
      });
    } catch (err) {
      console.error("Auto-fix Failed:", err);
      toast({
        title: "Error",
        description: "Failed to auto-fix code. Check your Gemini API key configuration.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={analyzeError}
          disabled={isAnalyzing || !error || isFixing}
          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              AI Analyze
            </>
          )}
        </Button>

        <Button
          onClick={autoFixCode}
          disabled={isFixing || !error || isAnalyzing}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              Auto Debug
            </>
          )}
        </Button>
      </div>

      {solution && (
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-3 text-orange-700 dark:text-orange-400">
            <CheckCircle2 className="h-5 w-5" />
            <h4 className="font-semibold">AI Solution</h4>
          </div>
          <div className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 max-h-64 overflow-y-auto">
            {solution}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ErrorSolver;
