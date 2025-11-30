import { Editor } from "@monaco-editor/react";
import { Card } from "@/components/ui/card";

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
}

const CodeEditor = ({ value, onChange, language }: CodeEditorProps) => {
  // Map our language keys to Monaco Editor language IDs
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      python: "python",
      javascript: "javascript",
      typescript: "typescript",
      c: "c",
      cpp: "cpp",
      java: "java",
      csharp: "csharp",
      php: "php",
      ruby: "ruby",
      go: "go",
      rust: "rust",
      kotlin: "kotlin",
      swift: "swift",
      r: "r",
      sql: "sql",
      html: "html",
    };
    return languageMap[lang] || "plaintext";
  };

  return (
    <Card className="h-full overflow-hidden border-border bg-editor shadow-soft">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
        }}
      />
    </Card>
  );
};

export default CodeEditor;
