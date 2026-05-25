import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type CameraState = "requesting" | "live" | "preview" | "error";

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, []);

  const startCamera = async () => {
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraState("live");
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera unavailable";
      setErrorMessage(
        msg.includes("Permission") || msg.includes("NotAllowed")
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access the camera. Make sure it's connected and not in use."
      );
      setCameraState("error");
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(url);
    stopStream();
    setCameraState("preview");
  };

  const retake = () => {
    setPreviewUrl(null);
    startCamera();
  };

  const usePhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/70 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) { stopStream(); onClose(); } }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="bg-white border-2 border-[#1C1917] rounded-2xl shadow-[6px_6px_0_#1C1917] w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1C1917] bg-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#1C1917]" />
              <span
                className="font-bold text-[#1C1917]"
                style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
              >
                {cameraState === "preview" ? "Preview Photo" : "Take a Photo"}
              </span>
            </div>
            <button
              onClick={() => { stopStream(); onClose(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#1C1917] hover:bg-[#F2C4C4] transition-colors"
            >
              <X className="w-4 h-4 text-[#1C1917]" />
            </button>
          </div>

          {/* Body */}
          <div className="relative bg-[#1C1917] aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraState === "live" ? "block" : "hidden"}`}
            />
            {cameraState === "preview" && previewUrl && (
              <img
                src={previewUrl}
                alt="Captured sheet music"
                className="w-full h-full object-contain"
              />
            )}
            {cameraState === "requesting" && (
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-10 h-10 border-2 border-white/30 border-t-[#7FFFD4] rounded-full animate-spin" />
                <p className="text-sm text-white/60">Starting camera…</p>
              </div>
            )}
            {cameraState === "error" && (
              <div className="flex flex-col items-center gap-4 text-white px-8 text-center">
                <Camera className="w-12 h-12 text-white/30" />
                <p className="text-sm text-white/60">{errorMessage}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-[#7FFFD4] text-[#1C1917] rounded-full text-sm font-medium hover:opacity-90 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Footer */}
          <div className="px-6 py-5 flex items-center justify-center gap-4 bg-white">
            {cameraState === "live" && (
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-[#1C1917] border-2 border-[#1C1917] hover:opacity-90 transition-all hover:scale-105 flex items-center justify-center shadow-[3px_3px_0_#1C1917]"
                aria-label="Capture photo"
              >
                <Camera className="w-7 h-7 text-[#7FFFD4]" />
              </button>
            )}
            {cameraState === "preview" && (
              <>
                <button
                  onClick={retake}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1C1917] bg-white text-[#1C1917] rounded-full font-medium hover:bg-[#F5F0E8] transition-all shadow-[2px_2px_0_#1C1917]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={usePhoto}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full font-medium hover:opacity-90 transition-all shadow-[3px_3px_0_#1C1917]"
                >
                  <Check className="w-4 h-4" />
                  Use Photo
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
