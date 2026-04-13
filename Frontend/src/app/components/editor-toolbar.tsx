import { Play, Pause, RotateCcw, Undo, Redo, Repeat, Sparkles } from "lucide-react";

interface EditorToolbarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  tempo: number;
  onTempoChange: (value: number) => void;
  isLooping: boolean;
  onLoopToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAIFix: () => void;
}

export function EditorToolbar({
  isPlaying,
  onPlayPause,
  tempo,
  onTempoChange,
  isLooping,
  onLoopToggle,
  onUndo,
  onRedo,
  onAIFix,
}: EditorToolbarProps) {
  return (
    <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={onPlayPause}
          className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-all hover:scale-105 shadow-lg"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        {/* Tempo Control */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm font-medium">Tempo</span>
          <input
            type="range"
            min="40"
            max="200"
            value={tempo}
            onChange={(e) => onTempoChange(Number(e.target.value))}
            className="w-32 accent-accent"
          />
          <span className="text-sm font-mono w-12 text-right">{tempo}</span>
        </div>

        {/* Loop Toggle */}
        <button
          onClick={onLoopToggle}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            isLooping
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span className="text-sm">Loop</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Undo"
        >
          <Undo className="w-5 h-5" />
        </button>
        <button
          onClick={onRedo}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Redo"
        >
          <Redo className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* AI Fix Button */}
        <button
          onClick={onAIFix}
          className="px-4 py-2 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Fix Notes</span>
        </button>

        {/* Reset */}
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
