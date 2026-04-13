import { useState, useEffect } from "react";
import { ArrowLeft, Save, Share2, Download } from "lucide-react";
import { Link } from "react-router";
import { EditorToolbar } from "../components/editor-toolbar";
import { EditorSidebar } from "../components/editor-sidebar";
import { SheetMusicCanvas } from "../components/sheet-music-canvas";
import { PlaybackTimeline } from "../components/playback-timeline";
import { PropertiesPanel } from "../components/properties-panel";
import { KeyboardShortcuts } from "../components/keyboard-shortcuts";
import { toast } from "sonner";

type Tool = "select" | "edit" | "erase" | "pan" | "practice";

export function EditorPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [isLooping, setIsLooping] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

  const duration = 120; // 2 minutes mock duration

  // Show welcome message on mount
  useEffect(() => {
    toast.success("Welcome to the Music Editor!", {
      description: "Click on notes to select them, or press Play to start",
      duration: 5000,
    });
  }, []);

  // Playback simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackPosition((prev) => {
        const next = prev + 1;
        
        // Handle looping
        if (isLooping && loopStart !== null && loopEnd !== null) {
          if (next > (loopEnd + 1) * 4) {
            return loopStart * 4;
          }
        }
        
        // Reset at end
        if (next >= 32) {
          setIsPlaying(false);
          return 0;
        }
        
        return next;
      });

      setCurrentTime((prev) => {
        const next = prev + (60 / tempo);
        if (next >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, (60 / tempo) * 1000);

    return () => clearInterval(interval);
  }, [isPlaying, tempo, isLooping, loopStart, loopEnd, duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTempoChange = (value: number) => {
    setTempo(value);
  };

  const handleLoopToggle = () => {
    setIsLooping(!isLooping);
    if (!isLooping) {
      toast.success("Loop mode enabled. Click and drag on measures to set loop region.");
    }
  };

  const handleUndo = () => {
    toast.info("Undo");
  };

  const handleRedo = () => {
    toast.info("Redo");
  };

  const handleAIFix = () => {
    toast.success("AI analyzing and fixing notation...", {
      description: "Fixed 3 notation errors and improved spacing",
    });
  };

  const handleLoopSelect = (start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
    toast.success(`Loop set: Measures ${start + 1} to ${end + 1}`);
  };

  const handleNoteSelect = (noteId: number) => {
    setSelectedNotes((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId);
      }
      return [...prev, noteId];
    });
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (property === 'delete') {
      toast.success(`Deleted ${selectedNotes.length} note(s)`);
      setSelectedNotes([]);
    } else {
      toast.info(`Updated ${property} for ${selectedNotes.length} note(s)`);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setPlaybackPosition(Math.floor((time / duration) * 32));
  };

  const handleSave = () => {
    toast.success("Project saved successfully");
  };

  const handleShare = () => {
    toast.success("Share link copied to clipboard");
  };

  const handleDownload = () => {
    toast.success("Downloading sheet music as PDF...");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="w-px h-6 bg-border" />
          <h1 className="text-lg font-semibold">Moonlight Sonata - Movement 1</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-accent text-accent-foreground hover:opacity-90 rounded-lg transition-opacity flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        tempo={tempo}
        onTempoChange={handleTempoChange}
        isLooping={isLooping}
        onLoopToggle={handleLoopToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAIFix={handleAIFix}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <EditorSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          isPracticeMode={isPracticeMode}
          onPracticeModeToggle={() => {
            setIsPracticeMode(!isPracticeMode);
            if (!isPracticeMode) {
              toast.success("Practice mode enabled", {
                description: "Notes will be highlighted as you play them",
              });
            }
          }}
        />

        {/* Canvas */}
        <SheetMusicCanvas
          isPlaying={isPlaying}
          playbackPosition={playbackPosition}
          loopStart={loopStart}
          loopEnd={loopEnd}
          onLoopSelect={handleLoopSelect}
          selectedNotes={selectedNotes}
          onNoteSelect={handleNoteSelect}
        />

        {/* Right Panel - Properties */}
        <PropertiesPanel
          selectedNotes={selectedNotes}
          onPropertyChange={handlePropertyChange}
        />
      </div>

      {/* Bottom Timeline */}
      <PlaybackTimeline
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  );
}