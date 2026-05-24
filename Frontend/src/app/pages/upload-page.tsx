import { useState, useEffect, useRef } from "react";
import { Upload, FileMusic, AlertCircle, LogIn, Camera } from "lucide-react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { motion } from "motion/react";
import { useAuth } from "../lib/auth-context";
import { CameraCapture } from "../components/camera-capture";
import { getCapturedFile, setCapturedFile } from "../lib/camera-store";

const AD_DURATION = 30;

export function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<"uploading" | "analyzing" | "converting">("uploading");
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_DURATION);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<"classical" | "jazz" | null>(null);
  const pendingFile = useRef<File[]>([]);
  const pendingScoreType = useRef<"classical" | "jazz">("classical");
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);
  const { currentUser, signInWithGoogle } = useAuth();

  useEffect(() => {
    const preloaded = getCapturedFile();
    if (preloaded) {
      setCapturedFile(null);
      handleFilesUpload([preloaded]);
    }
  }, []);

  useEffect(() => {
    if (!showAd) return;
    setAdCountdown(AD_DURATION);
    const interval = setInterval(() => {
      if (!document.hasFocus() || document.hidden) return;
      setAdCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          setShowAd(false);
          if (pendingFile.current.length > 0)
            runUpload(pendingFile.current, pendingScoreType.current);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showAd]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFilesUpload(Array.from(files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFilesUpload(Array.from(files));
  };

  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
  const MAX_SIZE_MB = 10;

  const handleFilesUpload = (files: File[]) => {
    setError(null);
    const invalid = files.find((f) => !ACCEPTED_TYPES.includes(f.type));
    if (invalid) {
      setError(`"${invalid.name}" is not a supported format. Use PNG, JPG, or PDF.`);
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds the 10MB limit.`);
      return;
    }
    const names = files.map((f) => f.name).join(", ");
    setFileName(names);
    pendingFile.current = files;
    if (files[0].type !== "application/pdf") {
      setPreviewUrl(URL.createObjectURL(files[0]));
    } else {
      setPreviewUrl(null);
    }
    setShowTypePicker(true);
  };

  const runUpload = async (files: File[], scoreType: "classical" | "jazz") => {
    if (!currentUser) {
      setError("Please sign in to transcribe sheet music.");
      return;
    }
    setProcessing(true);
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("score_type", scoreType);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");
      const idToken = await currentUser.getIdToken();
      setStage("uploading");
      const response = await fetch(`${apiUrl}/transcribe-multi`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Server error: ${response.status}`);
      }
      setStage("analyzing");
      const musicXml = await response.text();
      setStage("converting");
      await new Promise((r) => setTimeout(r, 800));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      navigate("/editor", { state: { musicXml, fileName: files[0].name } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setProcessing(false);
    setShowAd(false);
    setShowTypePicker(false);
    setSelectedType(null);
    setFileName("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    pendingFile.current = [];
  };

  return (
    <>
      <div className="relative min-h-screen bg-white">
        <Navbar />

        {/* Graph paper background */}
        <div
          className="fixed inset-0 pointer-events-none opacity-30 z-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(28, 25, 23, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(28, 25, 23, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative pt-32 pb-20 px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1
              className="text-7xl font-serif font-bold mb-4 tracking-tight"
              style={{
                fontFamily: "DM Serif Display, Georgia, serif",
                letterSpacing: "-0.03em",
              }}
            >
              Upload Your Score
            </h1>
            <p className="text-xl text-[#1C1917]/70">
              Snap a photo of your sheet music and we'll convert it to editable
              notation.
            </p>
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div
              onDragOver={!processing ? handleDragOver : undefined}
              onDragLeave={!processing ? handleDragLeave : undefined}
              onDrop={!processing ? handleDrop : undefined}
              className={`
                relative p-12 rounded-2xl border-4 border-dashed transition-all duration-300
                ${isDragging
                  ? "border-[#7FFFD4] bg-[#7FFFD4]/5 scale-[1.02]"
                  : "border-[#1C1917]/30 bg-white"
                }
              `}
            >
              {/* Staff lines inside upload zone — always visible in idle state */}
              {!showTypePicker && !processing && !error && !showAd && (
                <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-32 opacity-40 pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t-2 border-[#1C1917]"
                      style={{ top: `${i * 24}px` }}
                    />
                  ))}
                  <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-6xl opacity-60">
                    𝄞
                  </div>
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-[#1C1917] opacity-60" />
                  <div className="absolute -right-4 top-0 bottom-0 w-1 bg-[#1C1917] opacity-60" />
                </div>
              )}

              {/* Type picker */}
              {showTypePicker ? (
                <div className="relative z-10">
                  <h2
                    className="text-3xl font-serif font-bold mb-2 text-center"
                    style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
                  >
                    What type of score is this?
                  </h2>
                  <p className="text-center text-[#1C1917]/60 text-sm mb-8">
                    {fileName}
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <button
                      onClick={() => {
                        setSelectedType("classical");
                        pendingScoreType.current = "classical";
                        setShowTypePicker(false);
                        runUpload(pendingFile.current, "classical");
                      }}
                      className={`relative p-8 rounded-2xl border-2 transition-all text-left overflow-hidden
                        ${selectedType === "classical"
                          ? "border-[#1C1917] shadow-[6px_6px_0_#1C1917] bg-[#F2C4C4]"
                          : "border-[#1C1917]/20 hover:border-[#1C1917]/60 bg-white hover:shadow-[4px_4px_0_#1C1917]/20"
                        }`}
                    >
                      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-[#1C1917]/5 to-transparent" />
                      <h3
                        className="text-3xl font-serif font-bold mb-3"
                        style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
                      >
                        Classical
                      </h3>
                      <p className="text-sm text-[#1C1917]/60 mb-4">
                        Dense notation, complex arrangements
                      </p>
                      <div className="bg-[#F5F0E8] p-4 rounded-lg border border-[#1C1917]/10">
                        <div className="space-y-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-0.5 bg-[#1C1917]/40" />
                          ))}
                          <div className="text-2xl pt-2">♪ ♫ ♬ ♩ 𝄞</div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedType("jazz");
                        pendingScoreType.current = "jazz";
                        setShowTypePicker(false);
                        runUpload(pendingFile.current, "jazz");
                      }}
                      className={`relative p-8 rounded-2xl border-2 transition-all text-left overflow-hidden
                        ${selectedType === "jazz"
                          ? "border-[#1C1917] shadow-[6px_6px_0_#1C1917] bg-[#B8D8E8]"
                          : "border-[#1C1917]/20 hover:border-[#1C1917]/60 bg-white hover:shadow-[4px_4px_0_#1C1917]/20"
                        }`}
                    >
                      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-[#1C1917]/5 to-transparent" />
                      <h3
                        className="text-3xl font-serif font-bold mb-3"
                        style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
                      >
                        Jazz
                      </h3>
                      <p className="text-sm text-[#1C1917]/60 mb-4">
                        Lead sheets, chord symbols
                      </p>
                      <div className="bg-[#F5F0E8] p-4 rounded-lg border border-[#1C1917]/10">
                        <div className="space-y-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-0.5 bg-[#1C1917]/40" />
                          ))}
                          <div className="text-sm pt-2 font-mono">
                            Cmaj7 | Dm7 G7
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={handleReset}
                    className="mt-6 block mx-auto text-sm text-[#1C1917]/50 hover:text-[#1C1917] transition-colors"
                  >
                    ← Choose a different file
                  </button>
                </div>

              ) : showAd ? (
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 96 96"
                    >
                      <circle
                        cx="48" cy="48" r="44"
                        fill="none" stroke="currentColor" strokeWidth="4"
                        className="text-border"
                      />
                      <motion.circle
                        cx="48" cy="48" r="44"
                        fill="none" stroke="currentColor" strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 44}
                        strokeDashoffset={
                          2 * Math.PI * 44 * (adCountdown / AD_DURATION)
                        }
                        className="text-[#7FFFD4]"
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <span className="text-2xl font-bold text-[#1C1917]">
                      {adCountdown}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1C1917] mb-2">
                    A word from our sponsors
                  </h2>
                  <p className="text-[#1C1917]/60 mb-6 text-sm">
                    Your upload starts in {adCountdown} second
                    {adCountdown !== 1 ? "s" : ""}
                  </p>
                  <div className="w-full max-w-md mx-auto h-32 bg-[#F5F0E8] border-2 border-[#1C1917] rounded-xl flex items-center justify-center shadow-[4px_4px_0_#1C1917]">
                    <span className="text-[#1C1917]/40 text-sm tracking-widest uppercase">
                      [ Ad Placeholder ]
                    </span>
                  </div>
                </div>

              ) : error ? (
                <div className="text-center relative z-10">
                  <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1C1917] mb-3">
                    {error.includes("sign in")
                      ? "Sign In Required"
                      : "Processing Failed"}
                  </h2>
                  <p className="text-[#1C1917]/60 mb-6 max-w-md mx-auto text-sm">
                    {error}
                  </p>
                  {error.includes("sign in") ? (
                    <button
                      onClick={async () => {
                        handleReset();
                        await signInWithGoogle();
                      }}
                      className="px-8 py-4 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] inline-flex items-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In with Google
                    </button>
                  ) : (
                    <button
                      onClick={handleReset}
                      className="px-8 py-4 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917]"
                    >
                      Try Again
                    </button>
                  )}
                </div>

              ) : processing ? (
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative z-10">
                  {previewUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={previewUrl}
                        alt="Uploaded sheet music"
                        className="w-40 h-52 object-cover rounded-xl border-2 border-[#1C1917] shadow-[4px_4px_0_#1C1917]"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-5 min-w-[220px]">
                    <p className="text-sm text-[#1C1917]/60 mb-1">{fileName}</p>
                    {(["uploading", "analyzing", "converting"] as const).map(
                      (s, i) => {
                        const labels = {
                          uploading: "Uploading file",
                          analyzing: "Analyzing sheet music",
                          converting: "Converting to MusicXML",
                        };
                        const stageIndex = [
                          "uploading",
                          "analyzing",
                          "converting",
                        ].indexOf(stage);
                        const isDone = i < stageIndex;
                        const isCurrent = s === stage;

                        return (
                          <div key={s} className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
                              ${isDone
                                ? "bg-[#7FFFD4] border-[#1C1917]"
                                : isCurrent
                                ? "border-[#1C1917] animate-pulse"
                                : "border-[#1C1917]/30"
                              }`}
                            >
                              {isDone && (
                                <svg
                                  className="w-3 h-3 text-[#1C1917]"
                                  fill="none"
                                  viewBox="0 0 12 12"
                                >
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium transition-colors
                                ${isCurrent
                                  ? "text-[#1C1917]"
                                  : isDone
                                  ? "text-[#1C1917]/60"
                                  : "text-[#1C1917]/30"
                                }`}
                              >
                                {labels[s]}
                              </p>
                              {isCurrent && (
                                <div className="mt-1.5 w-full bg-[#F5F0E8] rounded-full h-1.5 overflow-hidden border border-[#1C1917]/20">
                                  <motion.div
                                    className="h-full bg-[#7FFFD4] rounded-full"
                                    animate={{ x: ["-100%", "100%"] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 1.5,
                                      ease: "easeInOut",
                                    }}
                                    style={{ width: "40%" }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                    <p className="text-xs text-[#1C1917]/40 mt-2">
                      This usually takes 3–5 minutes. Please keep this tab open.
                    </p>
                  </div>
                </div>

              ) : (
                <div className="text-center relative z-10">
                  <Upload
                    className="w-16 h-16 mx-auto mb-6 text-[#1C1917]/40"
                    strokeWidth={1.5}
                  />
                  <p
                    className="text-3xl mb-6 font-serif italic"
                    style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
                  >
                    {isDragging ? "Drop it here ♩" : "Drop your score here ♩"}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                      />
                      <span className="px-8 py-3 bg-[#7FFFD4] border-2 border-[#1C1917] rounded-full font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917] cursor-pointer inline-flex items-center gap-2">
                        <FileMusic className="w-5 h-5" />
                        Browse Files
                      </span>
                    </label>
                    <button
                      onClick={() => setShowCamera(true)}
                      className="px-8 py-3 bg-white border-2 border-[#1C1917] rounded-full font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917] inline-flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Use Camera
                    </button>
                  </div>
                  <p className="text-sm text-[#1C1917]/40 mt-8">
                    Supported formats: PNG, JPG, PDF · Multiple files supported
                    · Max 10MB each
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tips Panel */}
          {!processing && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative bg-[#F5E6A0] p-8 rounded-2xl border-2 border-[#1C1917] shadow-[6px_6px_0_#1C1917]"
              style={{ transform: "rotate(-0.5deg)" }}
            >
              <div
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#E74C3C] border-2 border-[#1C1917] shadow-md"
                style={{ transform: "rotate(0.5deg)" }}
              />
              <h3
                className="text-2xl font-serif font-bold mb-4"
                style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
              >
                📝 Tips for Best Results
              </h3>
              <ul className="space-y-2 text-[#1C1917]/80">
                <li className="flex items-start gap-2">
                  <span>♪</span>
                  <span>Use good lighting and avoid shadows across the staff lines</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>♪</span>
                  <span>Keep your camera parallel to the page — no angled shots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>♪</span>
                  <span>Include the full staff and any clefs or key signatures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>♪</span>
                  <span>Supported formats: JPG, PNG, PDF (max 10MB)</span>
                </li>
              </ul>
            </motion.div>
          )}
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        `}</style>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            setShowCamera(false);
            handleFilesUpload([file]);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
