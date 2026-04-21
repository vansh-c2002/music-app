import { MousePointer2, Trash2 } from "lucide-react";

export type EditorTool = "select" | "delete";

interface EditorSidebarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

export function EditorSidebar({ activeTool, onToolChange }: EditorSidebarProps) {
  return (
    <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-3">
      <button
        onClick={() => onToolChange("select")}
        title="Select"
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          activeTool === "select"
            ? "bg-accent text-accent-foreground shadow-lg"
            : "bg-card hover:bg-muted text-foreground"
        }`}
      >
        <MousePointer2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => onToolChange("delete")}
        title="Delete note (Del key)"
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          activeTool === "delete"
            ? "bg-accent text-accent-foreground shadow-lg"
            : "bg-card hover:bg-muted text-foreground"
        }`}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
