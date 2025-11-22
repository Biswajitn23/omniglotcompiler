import { Play, Trash2, Download, Code, Save, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControlPanelProps {
  language: string;
  onLanguageChange: (value: string) => void;
  onRun: () => void;
  onClear: () => void;
  onDownload: () => void;
  onFormat: () => void;
  onSave?: () => void;
  onDebug?: () => void;
  isRunning: boolean;
  hasError?: boolean;
}

const ControlPanel = ({
  language,
  onLanguageChange,
  onRun,
  onClear,
  onDownload,
  onFormat,
  onSave,
  onDebug,
  isRunning,
  hasError,
}: ControlPanelProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card border-b border-border">
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-48 bg-secondary border-border">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="python">Python</SelectItem>
          <SelectItem value="javascript">JavaScript</SelectItem>
          <SelectItem value="typescript">TypeScript</SelectItem>
          <SelectItem value="c">C</SelectItem>
          <SelectItem value="cpp">C++</SelectItem>
          <SelectItem value="java">Java</SelectItem>
          <SelectItem value="csharp">C#</SelectItem>
          <SelectItem value="php">PHP</SelectItem>
          <SelectItem value="ruby">Ruby</SelectItem>
          <SelectItem value="go">Go</SelectItem>
          <SelectItem value="rust">Rust</SelectItem>
          <SelectItem value="kotlin">Kotlin</SelectItem>
          <SelectItem value="swift">Swift</SelectItem>
          <SelectItem value="r">R</SelectItem>
          <SelectItem value="sql">SQL</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={onRun}
        disabled={isRunning}
        className="bg-gradient-primary hover:opacity-90 shadow-glow transition-all"
      >
        {isRunning ? (
          <>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Running...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Code
          </>
        )}
      </Button>

      {onSave && (
        <Button
          onClick={onSave}
          variant="secondary"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      )}

      <Button
        onClick={onFormat}
        variant="secondary"
        className="bg-secondary hover:bg-secondary/80"
      >
        <Code className="mr-2 h-4 w-4" />
        Format
      </Button>

      <Button
        onClick={onClear}
        variant="secondary"
        className="bg-secondary hover:bg-secondary/80"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Clear
      </Button>

      <Button
        onClick={onDownload}
        variant="secondary"
        className="bg-secondary hover:bg-secondary/80"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
};

export default ControlPanel;
