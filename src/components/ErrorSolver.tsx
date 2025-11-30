import { useState } from "react";
import { Wand2, Loader2, CheckCircle2, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { callOpenAI } from "@/lib/openai";

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
      const systemPrompt = `You are an expert ${language} programmer and debugging assistant. Carefully analyze code, runtime errors, and provide actionable fixes.`;

      const prompt = `Code:
\`\`\`${language}
${code}
\`\`\`

Error Message:
${error}

Please provide:
1. Error Explanation — why it happened
2. Solution — how to fix it
3. Fixed Code — corrected code if applicable
4. Prevention Tips — how to avoid repeating it

Format the response using the numbered sections above.`;

      const text = await callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.2 },
      );

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
        description: "Failed to analyze error. Check your OpenAI API key configuration.",
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
      const systemPrompt = `You are an expert ${language} programmer. Produce corrected source code ready to paste into the editor.`;

      const prompt = `Current Code:
\`\`\`${language}
${code}
\`\`\`

Error Message:
${error}

Respond ONLY with the fixed code. Do not include explanations or markdown fences — just the raw corrected code.`;

      let text = await callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.1 },
      );

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
        description: "Failed to auto-fix code. Check your OpenAI API key configuration.",
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
