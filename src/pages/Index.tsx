import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import CodeEditor from "@/components/CodeEditor";
import ControlPanel from "@/components/ControlPanel";
import OutputConsole from "@/components/OutputConsole";
import InputBox from "@/components/InputBox";
import AIChatbot from "@/components/AIChatbot";
import ErrorSolver from "@/components/ErrorSolver";
import { callOpenAI } from "@/lib/openai";

const defaultCode: Record<string, string> = {
  python: `# Python
print("Hello, World!")`,
  javascript: `// JavaScript
console.log("Hello, World!");`,
  typescript: `// TypeScript
console.log("Hello, World!");`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  csharp: `// C#
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
  php: `<?php
// PHP
echo "Hello, World!\\n";
?>`,
  ruby: `# Ruby
puts "Hello, World!"`,
  go: `// Go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  rust: `// Rust
fn main() {
    println!("Hello, World!");
}`,
  kotlin: `// Kotlin
fun main() {
    println("Hello, World!")
}`,
  swift: `// Swift
print("Hello, World!")`,
  r: `# R
print("Hello, World!")`,
  html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a simple HTML page.</p>
</body>
</html>`,
  sql: `-- SQL
SELECT 'Hello, World!' AS message;`,
};

const Index = () => {
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>(defaultCode.cpp);
  const [input, setInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastSavedCode, setLastSavedCode] = useState<string>("");

  // Auto-save code to database when user is logged in
  useEffect(() => {
    const saveCodeToDatabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && code && code.length > 10 && code !== lastSavedCode) {
          const { error } = await supabase.from("code_history").insert({
            user_id: user.id,
            language: language,
            code: code,
          });
          
          if (!error) {
            setLastSavedCode(code);
            console.log("Code saved to history");
          } else {
            console.error("Failed to save code:", error);
          }
        }
      } catch (error) {
        // Silently fail - don't interrupt user
        console.error("Failed to save code:", error);
      }
    };

    // Debounce auto-save
    const timer = setTimeout(() => {
      saveCodeToDatabase();
    }, 10000); // Save after 10 seconds of no changes

    return () => clearTimeout(timer);
  }, [code, language]);

  const handleLoadCode = (loadedCode: string, loadedLanguage: string) => {
    setLanguage(loadedLanguage);
    setCode(loadedCode);
    setOutput("");
    setError("");
    setExecutionTime(null);
  };

  // Load saved code from localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${language}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(defaultCode[language] || `// Write your ${language} code here`);
    }
  }, [language]);

  // Save code to localStorage
  useEffect(() => {
    if (code) {
      localStorage.setItem(`code_${language}`, code);
    }
  }, [code, language]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setOutput("");
    setError("");
    setExecutionTime(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");
    setExecutionTime(null);

    try {
      const startTime = Date.now();
      
      // Special handling for HTML - show preview instead of running through Judge0
      if (language === 'html') {
        const endTime = Date.now();
        setExecutionTime(endTime - startTime);
        setOutput(`HTML Preview:\n\n${code}`);
        toast({
          title: "HTML Ready",
          description: "HTML preview is displayed below. Open in browser to see rendered output.",
        });
        setIsRunning(false);
        return;
      }
      
      // Judge0 Language IDs (Judge0 API)
      const languageIds: Record<string, number> = {
        python: 71,      // Python 3.8.1
        javascript: 63,  // JavaScript (Node.js 12.14.0)
        typescript: 74,  // TypeScript 3.7.4
        c: 50,          // C (GCC 9.2.0)
        cpp: 54,        // C++ (GCC 9.2.0)
        java: 62,       // Java (OpenJDK 13.0.1)
        csharp: 51,     // C# (Mono 6.6.0.161)
        php: 68,        // PHP 7.4.1
        ruby: 72,       // Ruby 2.7.0
        go: 60,         // Go 1.13.5
        rust: 73,       // Rust 1.40.0
        kotlin: 78,     // Kotlin 1.3.70
        swift: 83,      // Swift 5.2.3
        r: 80,          // R 4.0.0
        sql: 82,        // SQL (SQLite 3.27.2)
      };

      const languageId = languageIds[language];
      
      // Create submission
      const submissionResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': import.meta.env.VITE_JUDGE0_API_KEY || 'demo-key',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input,
        })
      });

      if (!submissionResponse.ok) {
        throw new Error('Failed to submit code');
      }

      const result = await submissionResponse.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (result.status.id === 3) { // Accepted
        setOutput(result.stdout || "Program executed successfully with no output.");
        toast({
          title: "Success",
          description: "Code executed successfully!",
        });
      } else if (result.status.id === 6) { // Compilation Error
        setError(result.compile_output || "Compilation error occurred.");
        toast({
          title: "Compilation Error",
          description: "Your code has compilation errors.",
          variant: "destructive",
        });
      } else if (result.stderr) {
        setError(result.stderr);
        toast({
          title: "Runtime Error",
          description: "An error occurred during execution.",
          variant: "destructive",
        });
      } else {
        setOutput(result.stdout || "");
        if (result.status.description !== "Accepted") {
          setError(`Status: ${result.status.description}`);
        }
      }
    } catch (err) {
      setError("An error occurred while executing the code. Make sure you have set up the Judge0 API key.");
      toast({
        title: "Error",
        description: "Failed to execute code. Check console for details.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setCode(defaultCode[language] || `// Write your ${language} code here`);
    setInput("");
    setOutput("");
    setError("");
    setExecutionTime(null);
    toast({
      title: "Cleared",
      description: "Editor and console have been cleared.",
    });
  };

  const handleDownload = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setFont("helvetica", "normal");
        }
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 3;
      };

      // Add title
      pdf.setFillColor(66, 135, 245);
      pdf.rect(0, 0, pageWidth, 30, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Omniglot Compiler - Code Execution Report", pageWidth / 2, 18, { align: "center" });
      
      yPosition = 40;
      pdf.setTextColor(0, 0, 0);

      // Add Language
      addText(`Language: ${language.toUpperCase()}`, 12, true);
      yPosition += 2;

      // Add Code Section
      addText("SOURCE CODE:", 14, true);
      pdf.setFillColor(245, 245, 245);
      const codeStartY = yPosition;
      pdf.rect(margin - 2, codeStartY - 5, maxWidth + 4, Math.min(code.split("\n").length * 5 + 10, 100), "F");
      pdf.setFontSize(9);
      pdf.setFont("courier", "normal");
      const codeLines = code.split("\n");
      codeLines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        const wrappedLines = pdf.splitTextToSize(line || " ", maxWidth - 4);
        wrappedLines.forEach((wrappedLine: string) => {
          pdf.text(wrappedLine, margin, yPosition);
          yPosition += 4;
        });
      });
      yPosition += 8;

      // Add Input Section
      if (input.trim()) {
        addText("INPUT:", 14, true);
        pdf.setFillColor(240, 248, 255);
        const inputStartY = yPosition;
        const inputHeight = Math.min(input.split("\n").length * 5 + 10, 40);
        pdf.rect(margin - 2, inputStartY - 5, maxWidth + 4, inputHeight, "F");
        pdf.setFontSize(9);
        pdf.setFont("courier", "normal");
        const inputLines = input.split("\n");
        inputLines.forEach((line) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line || " ", margin, yPosition);
          yPosition += 4;
        });
        yPosition += 8;
      }

      // Add Output Section
      if (output || error) {
        addText("OUTPUT:", 14, true);
        const outputText = error || output;
        const bgColor = error ? [255, 240, 240] : [240, 255, 240];
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        const outputStartY = yPosition;
        const outputHeight = Math.min(outputText.split("\n").length * 5 + 10, 60);
        pdf.rect(margin - 2, outputStartY - 5, maxWidth + 4, outputHeight, "F");
        pdf.setFontSize(9);
        pdf.setFont("courier", "normal");
        if (error) {
          pdf.setTextColor(200, 0, 0);
        }
        const outputLines = outputText.split("\n");
        outputLines.forEach((line) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line || " ", margin, yPosition);
          yPosition += 4;
        });
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;
      }

      // Add Execution Time if available
      if (executionTime !== null) {
        addText(`Execution Time: ${executionTime}ms`, 10, true);
      }

      // Add footer
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on: ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Save PDF
      pdf.save(`omniglot_${language}_${Date.now()}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: `Code report saved as PDF`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleFormat = () => {
    try {
      let formatted = code;
      const lines = code.split('\n');
      
      // Language-specific formatting
      if (language === 'python') {
        // Python: Smart indentation based on colons and keywords
        let indent = 0;
        const result: string[] = [];
        const indentKeywords = ['if', 'elif', 'else', 'for', 'while', 'def', 'class', 'try', 'except', 'finally', 'with'];
        
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          
          if (!trimmed) {
            result.push('');
            continue;
          }
          
          // Check if line should decrease indent (else, elif, except, finally)
          if (trimmed.startsWith('else:') || trimmed.startsWith('elif ') || 
              trimmed.startsWith('except') || trimmed.startsWith('finally:')) {
            indent = Math.max(0, indent - 1);
          }
          
          // Add the line with current indentation
          result.push('    '.repeat(indent) + trimmed);
          
          // Check if next line should increase indent
          if (trimmed.endsWith(':')) {
            indent++;
          }
          
          // Check if we need to decrease indent (look for dedent patterns)
          // If next non-empty line doesn't start with indentation keywords and previous ended with :
          const nextLine = lines[i + 1]?.trim();
          if (nextLine && !trimmed.endsWith(':') && 
              !indentKeywords.some(kw => trimmed.startsWith(kw))) {
            // Keep indent as is
          }
          
          // Detect return/break/continue/pass at end of blocks
          if (trimmed.startsWith('return') || trimmed.startsWith('break') || 
              trimmed.startsWith('continue') || trimmed === 'pass') {
            // Check if next line is at lower indent level
            const nextNonEmpty = lines.slice(i + 1).find(l => l.trim());
            if (nextNonEmpty) {
              const nextIndent = nextNonEmpty.search(/\S/);
              const currentIndent = indent * 4;
              if (nextIndent < currentIndent) {
                indent = Math.max(0, Math.floor(nextIndent / 4));
              }
            }
          }
        }
        
        formatted = result.join('\n');
      } else if (language === 'javascript' || language === 'typescript') {
        // JS/TS: Basic formatting with 2 spaces
        let indent = 0;
        const result: string[] = [];
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            result.push('');
            continue;
          }
          
          // Decrease indent for closing braces
          if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
            indent = Math.max(0, indent - 1);
          }
          
          result.push('  '.repeat(indent) + trimmed);
          
          // Increase indent for opening braces
          const openBraces = (trimmed.match(/[\{]/g) || []).length;
          const closeBraces = (trimmed.match(/[\}]/g) || []).length;
          indent += openBraces - closeBraces;
          indent = Math.max(0, indent);
        }
        
        formatted = result.join('\n');
      } else if (['c', 'cpp', 'java', 'csharp'].includes(language)) {
        // C-style languages: 4 spaces
        let indent = 0;
        const result: string[] = [];
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            result.push('');
            continue;
          }
          
          // Decrease indent for closing braces
          if (trimmed.startsWith('}')) {
            indent = Math.max(0, indent - 1);
          }
          
          result.push('    '.repeat(indent) + trimmed);
          
          // Increase indent for opening braces
          if (trimmed.endsWith('{')) {
            indent++;
          }
        }
        
        formatted = result.join('\n');
      } else if (language === 'sql') {
        // SQL: Uppercase keywords
        const keywords = [
          'select', 'from', 'where', 'join', 'on', 'group by', 'order by', 
          'having', 'insert', 'into', 'values', 'update', 'set', 'delete', 
          'create', 'table', 'alter', 'drop', 'and', 'or', 'as', 'by', 
          'asc', 'desc', 'limit', 'offset', 'inner', 'left', 'right', 
          'outer', 'union', 'distinct', 'count', 'sum', 'avg', 'min', 'max'
        ];
        
        formatted = code;
        keywords.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          formatted = formatted.replace(regex, keyword.toUpperCase());
        });
      } else if (language === 'html') {
        // HTML: Smart indentation based on tags
        let indent = 0;
        const result: string[] = [];
        const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (!trimmed) {
            result.push('');
            continue;
          }
          
          // Check for closing tag at start
          if (trimmed.startsWith('</')) {
            indent = Math.max(0, indent - 1);
          }
          
          // Add the line with current indentation
          result.push('  '.repeat(indent) + trimmed);
          
          // Check if line opens a tag (but not self-closing or inline close)
          const openTagMatch = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
          const hasClosingTag = trimmed.includes('</');
          const isSelfClosing = trimmed.endsWith('/>') || (openTagMatch && selfClosingTags.includes(openTagMatch[1].toLowerCase()));
          
          if (openTagMatch && !hasClosingTag && !isSelfClosing) {
            indent++;
          }
          
          // If line has both opening and closing tag, don't change indent
          // Already handled by hasClosingTag check above
        }
        
        formatted = result.join('\n');
      } else {
        // Generic: Just clean whitespace
        formatted = lines.map(line => line.trimEnd()).join('\n');
      }
      
      setCode(formatted);
      toast({
        title: "Code Formatted",
        description: `${language.toUpperCase()} code has been formatted successfully.`,
      });
    } catch (error) {
      console.error('Format error:', error);
      toast({
        title: "Format Failed",
        description: "Could not format code. Please check your syntax.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save your code.",
          variant: "destructive",
        });
        return;
      }

      if (!code || code.length < 10) {
        toast({
          title: "Nothing to save",
          description: "Write some code first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("code_history").insert({
        user_id: user.id,
        language: language,
        code: code,
      });

      if (error) throw error;

      setLastSavedCode(code);
      toast({
        title: "Saved!",
        description: "Code saved to your history.",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save code.",
        variant: "destructive",
      });
    }
  };

  const handleDebug = async () => {
    if (!error.trim()) {
      toast({
        title: "No Error",
        description: "There's no error to debug.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    toast({
      title: "Debugging...",
      description: "AI is analyzing and fixing your code.",
    });

    try {
      const systemPrompt = `You are an expert ${language} programmer. When asked to fix code, reply with the fully corrected source ready to paste into the editor.`;

      const prompt = `Current Code:
\`\`\`${language}
${code}
\`\`\`

Error Message:
${error}

Respond ONLY with the fixed code. Do not include explanations, markdown, or code fences — just the raw corrected code.`;

      let text = await callOpenAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.15 },
      );

      // Remove code block markers if present
      text = text.replace(/```[\w]*\n?/g, '').trim();

      setCode(text);
      setError("");
      setOutput("");
      toast({
        title: "Code Fixed!",
        description: "AI has automatically debugged and fixed your code.",
      });
    } catch (err: any) {
      console.error("Auto-debug Failed:", err);
      toast({
        title: "Debug Failed",
        description: err.message || "Failed to auto-debug code. Check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onLoadCode={handleLoadCode} />
      
      <div className="flex-1 container mx-auto p-4 flex flex-col gap-4">
        <ControlPanel
          language={language}
          onLanguageChange={handleLanguageChange}
          onRun={handleRun}
          onClear={handleClear}
          onDownload={handleDownload}
          onFormat={handleFormat}
          onSave={handleSave}
          onDebug={handleDebug}
          isRunning={isRunning}
          hasError={!!error}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Editor Section */}
          <div className="flex flex-col gap-4 min-h-[500px] lg:min-h-0">
            <div className="flex-1">
              <CodeEditor
                value={code}
                onChange={(value) => setCode(value || "")}
                language={language}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col gap-4 min-h-[500px] lg:min-h-0">
            <div className="flex-[2]">
              <OutputConsole
                output={output}
                error={error}
                executionTime={executionTime}
                language={language}
              />
            </div>
            {error && (
              <ErrorSolver
                code={code}
                language={language}
                error={error}
                onSolutionGenerated={(solution) => {
                  console.log("AI Solution:", solution);
                }}
                onCodeFixed={(fixedCode) => {
                  setCode(fixedCode);
                  setError("");
                  toast({
                    title: "Code Updated",
                    description: "Your code has been automatically fixed!",
                  });
                }}
              />
            )}
            {language !== 'html' && (
              <div className="flex-1 min-h-[150px]">
                <InputBox value={input} onChange={setInput} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AIChatbot 
        code={code} 
        language={language} 
        error={error} 
        onCodeChange={(newCode) => setCode(newCode)}
      />
    </div>
  );
};

export default Index;
