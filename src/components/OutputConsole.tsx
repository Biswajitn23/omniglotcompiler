import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface OutputConsoleProps {
  output: string;
  error: string;
  executionTime: number | null;
}

const OutputConsole = ({ output, error, executionTime }: OutputConsoleProps) => {
  return (
    <Card className="h-full overflow-hidden border-border bg-console shadow-soft flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between bg-card/50">
        <h3 className="text-sm font-semibold text-foreground">Output</h3>
        {executionTime !== null && (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {executionTime}ms
          </Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {error ? (
          <div className="text-error whitespace-pre-wrap">{error}</div>
        ) : output ? (
          <div className="text-success whitespace-pre-wrap">{output}</div>
        ) : (
          <div className="text-muted-foreground">
            No output yet. Click "Run Code" to execute your program.
          </div>
        )}
      </div>
    </Card>
  );
};

export default OutputConsole;
