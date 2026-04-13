import { MousePointer2, Edit3, Eraser, Hand, Target } from "lucide-react";

type Tool = "select" | "edit" | "erase" | "pan" | "practice";

interface EditorSidebarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  isPracticeMode: boolean;
  onPracticeModeToggle: () => void;
}

export function EditorSidebar({
  activeTool,
  onToolChange,
  isPracticeMode,
  onPracticeModeToggle,
}: EditorSidebarProps) {
  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "edit", icon: Edit3, label: "Edit Note" },
    { id: "erase", icon: Eraser, label: "Erase" },
    { id: "pan", icon: Hand, label: "Pan" },
  ];

  return (
    <div className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 gap-2">
      <div className="text-xs font-semibold text-muted-foreground mb-4 rotate-0">
        TOOLS
      </div>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center transition-all
            ${activeTool === tool.id
              ? 'bg-accent text-accent-foreground shadow-lg scale-105'
              : 'bg-card hover:bg-muted text-foreground'
            }
          `}
          title={tool.label}
        >
          <tool.icon className="w-6 h-6" />
        </button>
      ))}

      <div className="w-12 h-px bg-border my-4" />

      {/* Practice Mode Toggle */}
      <button
        onClick={onPracticeModeToggle}
        className={`
          w-14 h-14 rounded-xl flex items-center justify-center transition-all
          ${isPracticeMode
            ? 'bg-accent text-accent-foreground shadow-lg'
            : 'bg-card hover:bg-muted text-foreground'
          }
        `}
        title="Practice Mode"
      >
        <Target className="w-6 h-6" />
      </button>

      {isPracticeMode && (
        <div className="absolute left-24 top-80 bg-card border border-border rounded-lg px-3 py-1.5 shadow-lg">
          <p className="text-xs text-accent font-medium whitespace-nowrap">Practice Mode</p>
        </div>
      )}
    </div>
  );
}
