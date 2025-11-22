import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
}

const InputBox = ({ value, onChange }: InputBoxProps) => {
  return (
    <Card className="h-full overflow-hidden border-border bg-console shadow-soft flex flex-col">
      <div className="p-3 border-b border-border bg-card/50">
        <h3 className="text-sm font-semibold text-foreground">Input (stdin)</h3>
      </div>
      <div className="flex-1 p-4">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter input for your program here..."
          className="h-full resize-none bg-transparent border-0 focus-visible:ring-0 font-mono text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </Card>
  );
};

export default InputBox;
