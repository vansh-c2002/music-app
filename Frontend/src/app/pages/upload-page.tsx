import { useState } from "react";
import { Upload, FileMusic, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { motion } from "motion/react";

export function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) throw new Error("API URL not configured");

      const response = await fetch(`${apiUrl}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Server error: ${response.status}`);
      }

      const musicXml = await response.text();
      navigate("/editor", { state: { musicXml, fileName: file.name } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setError(null);
    setProcessing(false);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-primary mb-4">Upload Your Sheet Music</h1>
            <p className="text-xl text-muted-foreground">
              Support for PNG and JPG files
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div
              onDragOver={!processing ? handleDragOver : undefined}
              onDragLeave={!processing ? handleDragLeave : undefined}
              onDrop={!processing ? handleDrop : undefined}
              className={`
                relative border-4 border-dashed rounded-2xl p-16 transition-all duration-300
                ${isDragging
                  ? "border-accent bg-accent/10 scale-105"
                  : "border-border bg-card hover:border-accent/50"
                }
              `}
            >
              {error ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                  <h2 className="text-2xl font-semibold text-primary mb-3">Processing Failed</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">{error}</p>
                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : processing ? (
                <div className="text-center">
                  <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileMusic className="w-12 h-12 text-accent animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-semibold text-primary mb-3">Analyzing Your Sheet Music</h2>
                  <p className="text-muted-foreground mb-2">{fileName}</p>
                  <p className="text-sm text-muted-foreground mb-8">
                    This usually takes 3–5 minutes. Please keep this tab open.
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-accent rounded-full"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-12 h-12 text-primary" />
                  </div>

                  <h2 className="text-2xl font-semibold text-primary mb-3">
                    {isDragging ? "Drop your file here" : "Drag & drop your sheet music"}
                  </h2>

                  <p className="text-muted-foreground mb-8">or</p>

                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="px-8 py-4 bg-accent text-accent-foreground rounded-lg cursor-pointer hover:opacity-90 transition-all inline-flex items-center gap-2">
                      <FileMusic className="w-5 h-5" />
                      Browse Files
                    </span>
                  </label>

                  <p className="text-sm text-muted-foreground mt-8">
                    Supported formats: PNG, JPG (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {!processing && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-8"
            >
              <h3 className="text-lg font-semibold text-primary mb-4">Tips for best results:</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2" />
                  <span>Use high-resolution scans or photos for better accuracy</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2" />
                  <span>Ensure good lighting and minimize shadows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2" />
                  <span>Western music notation only — printed scores work best</span>
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
