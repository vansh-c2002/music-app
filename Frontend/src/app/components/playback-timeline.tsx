import { motion } from "motion/react";

interface PlaybackTimelineProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function PlaybackTimeline({
  currentTime,
  duration,
  onSeek,
}: PlaybackTimelineProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border-t border-border px-6 py-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-muted-foreground w-12">
          {formatTime(currentTime)}
        </span>
        
        <div
          className="flex-1 h-2 bg-muted rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 top-0 bottom-0 bg-accent rounded-full"
          />
          
          {/* Playhead */}
          <motion.div
            animate={{ left: `${progress}%` }}
            transition={{ duration: 0.1 }}
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-lg border-2 border-card -ml-2"
          />
        </div>
        
        <span className="text-sm font-mono text-muted-foreground w-12">
          {formatTime(duration)}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="mt-3 flex items-center justify-center gap-1 h-12">
        {Array.from({ length: 60 }).map((_, i) => {
          const height = Math.random() * 100;
          const isPast = (i / 60) * duration <= currentTime;
          
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-colors ${
                isPast ? 'bg-accent' : 'bg-muted'
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
