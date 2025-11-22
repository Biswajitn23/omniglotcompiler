import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Clock, Code2, Trash2, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CodeHistory {
  id: string;
  language: string;
  code: string;
  created_at: string;
  title?: string;
}

interface CodeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCode: (code: string, language: string) => void;
}

const CodeHistoryDialog = ({ open, onOpenChange, onLoadCode }: CodeHistoryDialogProps) => {
  const [history, setHistory] = useState<CodeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("code_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch code history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadCode = (item: CodeHistory) => {
    onLoadCode(item.code, item.language);
    onOpenChange(false);
    toast({
      title: "Code Loaded",
      description: `Loaded ${item.language} code from ${new Date(item.created_at).toLocaleDateString()}`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("code_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory(history.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "Code history item deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Code History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Code2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No code history yet</p>
              <p className="text-sm">Your saved code will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Card key={item.id} className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{item.language}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <pre className="text-xs bg-secondary p-2 rounded overflow-x-auto max-h-20">
                        <code>{item.code.substring(0, 150)}{item.code.length > 150 ? "..." : ""}</code>
                      </pre>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadCode(item)}
                        className="whitespace-nowrap"
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CodeHistoryDialog;
