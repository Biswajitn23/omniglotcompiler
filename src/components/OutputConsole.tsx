import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

interface OutputConsoleProps {
  output: string;
  error: string;
  executionTime: number | null;
  language?: string;
}

const OutputConsole = ({ output, error, executionTime, language }: OutputConsoleProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Check if output is HTML preview
  const isHtmlPreview = language === 'html' && output.startsWith('HTML Preview:');
  const htmlContent = isHtmlPreview ? output.replace('HTML Preview:\n\n', '') : '';

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <Card className="h-full overflow-hidden border-border bg-console shadow-soft flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between bg-card/50">
          <h3 className="text-sm font-semibold text-foreground">
            {isHtmlPreview ? 'HTML Preview' : 'Output'}
          </h3>
          <div className="flex items-center gap-2">
            {executionTime !== null && (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {executionTime}ms
              </Badge>
            )}
            {isHtmlPreview && (
              <Button
                size="sm"
                variant="outline"
                onClick={toggleFullscreen}
                className="h-7 px-2"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
          {error ? (
            <div className="text-error whitespace-pre-wrap">{error}</div>
          ) : isHtmlPreview ? (
            <div className="w-full h-full border-2 border-success rounded-lg overflow-hidden shadow-lg">
              <iframe
                srcDoc={htmlContent}
                title="HTML Preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts"
              />
            </div>
          ) : output ? (
            <div className="text-success whitespace-pre-wrap">{output}</div>
          ) : (
            <div className="text-muted-foreground">
              No output yet. Click "Run Code" to execute your program.
            </div>
          )}
        </div>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && isHtmlPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="p-4 bg-card border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">HTML Preview - Fullscreen</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              srcDoc={htmlContent}
              title="HTML Preview Fullscreen"
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default OutputConsole;
