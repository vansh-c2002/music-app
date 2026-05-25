import { MousePointer2, Trash2 } from "lucide-react";

export type EditorTool = "select" | "delete";

interface EditorSidebarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

export function EditorSidebar({ activeTool, onToolChange }: EditorSidebarProps) {
  return (
    <div className="w-14 bg-white border-r border-[#1C1917]/10 flex flex-col items-center py-4 gap-2 shrink-0">
      {[
        { tool: "select" as EditorTool, icon: MousePointer2, label: "Select" },
        { tool: "delete" as EditorTool, icon: Trash2, label: "Delete note (Del key)" },
      ].map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => onToolChange(tool)}
          title={label}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
            activeTool === tool
              ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[2px_2px_0_#1C1917]"
              : "bg-white text-[#1C1917]/50 border-transparent hover:border-[#1C1917]/20 hover:text-[#1C1917]"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
