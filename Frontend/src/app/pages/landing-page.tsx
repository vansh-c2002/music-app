import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Camera, Upload, FileEdit } from "lucide-react";
import { CameraCapture } from "../components/camera-capture";
import { setCapturedFile } from "../lib/camera-store";
import { Navbar } from "../components/navbar";

export function LandingPage() {
  const [showCamera, setShowCamera] = useState(false);
  const navigate = useNavigate();

  const handleCapture = (file: File) => {
    setCapturedFile(file);
    setShowCamera(false);
    navigate("/upload");
  };

  return (
    <>
      <div className="relative bg-white">
        <Navbar />
        {/* Graph paper background */}
        <div
          className="fixed inset-0 pointer-events-none opacity-60 z-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(28, 25, 23, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(28, 25, 23, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Hero Section */}
        <section className="relative py-20 px-6 pt-40">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text */}
              <div className="relative z-10">
                <div className="inline-block px-4 py-2 bg-[#F0FAF4] border border-[#1C1917]/10 rounded-full text-sm font-medium mb-6">
                  PHOTO → SCORE, INSTANTLY
                </div>

                <h1
                  className="text-8xl font-serif font-bold mb-6 tracking-tight leading-[0.95]"
                  style={{
                    fontFamily: "DM Serif Display, Georgia, serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Oh <span className="italic">Sheet!</span>
                </h1>

                <p className="text-xl text-[#1C1917]/80 mb-3 leading-relaxed">
                  Turn any sheet music into an editable digital score —
                  instantly. Photograph, upload, and export to MuseScore, PDF,
                  and more.
                </p>

                <div className="flex flex-wrap gap-4 mt-6">
                  <Link
                    to="/upload"
                    className="inline-block px-8 py-4 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full text-lg font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917]"
                  >
                    Scan Your First Score →
                  </Link>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#1C1917] rounded-full text-lg font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917]"
                  >
                    <Camera className="w-5 h-5" />
                    Take a Photo
                  </button>
                </div>
              </div>

              {/* Right side - Before/After */}
              <div className="relative z-10 grid grid-cols-2 gap-6">
                {/* Before */}
                <div className="bg-[#F5F0E8] p-8 rounded-2xl border-2 border-[#1C1917] shadow-[6px_6px_0_#1C1917]">
                  <div className="text-xs font-medium text-[#1C1917]/60 mb-4">
                    photo
                  </div>
                  <div className="space-y-2 mb-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-0.5 bg-[#1C1917]/40" />
                    ))}
                  </div>
                  <div className="text-5xl">♪ ♫ ♬</div>
                </div>

                {/* After */}
                <div className="bg-white p-8 rounded-2xl border-2 border-[#1C1917] shadow-[6px_6px_0_#1C1917] translate-y-8">
                  <div className="text-xs font-medium text-[#1C1917]/60 mb-4">
                    digital score
                  </div>
                  <div className="space-y-2 mb-6">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-0.5 bg-[#1C1917]" />
                    ))}
                  </div>
                  <div className="text-5xl">♪ ♫ ♬</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee strip */}
        <div className="relative z-10 bg-[#1C1917] text-white py-3 overflow-hidden border-y-2 border-[#1C1917]">
          <div className="animate-marquee whitespace-nowrap text-xs font-bold tracking-wide">
            <span className="mx-6">SCAN YOUR SCORE ♪</span>
            <span className="mx-6">EDIT IN SECONDS ♪</span>
            <span className="mx-6">EXPORT TO MUSESCORE ♪</span>
            <span className="mx-6">EXPORT TO PDF ♪</span>
            <span className="mx-6">NO MORE RETYPING ♪</span>
            <span className="mx-6">OH SHEET! ♪</span>
            <span className="mx-6">FREE TO TRY ♪</span>
            <span className="mx-6">CLASSICAL + JAZZ ♪</span>
            <span className="mx-6">SCAN YOUR SCORE ♪</span>
            <span className="mx-6">EDIT IN SECONDS ♪</span>
            <span className="mx-6">EXPORT TO MUSESCORE ♪</span>
            <span className="mx-6">EXPORT TO PDF ♪</span>
            <span className="mx-6">NO MORE RETYPING ♪</span>
            <span className="mx-6">OH SHEET! ♪</span>
            <span className="mx-6">FREE TO TRY ♪</span>
            <span className="mx-6">CLASSICAL + JAZZ ♪</span>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="relative py-24 px-6 bg-[#F0FAF4]">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(28, 25, 23, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(28, 25, 23, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-6">
              <div className="text-sm font-medium text-[#1C1917]/60 mb-2">
                SIMPLE AS A CHORD
              </div>
              <h2
                className="text-7xl font-serif font-bold tracking-tight leading-tight"
                style={{
                  fontFamily: "DM Serif Display, Georgia, serif",
                  letterSpacing: "-0.03em",
                }}
              >
                Three steps to your
                <br />
                <span className="italic">perfect</span> digital score
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              {[
                {
                  num: "01",
                  title: "Photograph your score",
                  desc: "Snap a photo with your phone camera or upload a scan",
                  color: "#B8D4B0",
                  icon: Camera,
                },
                {
                  num: "02",
                  title: "Upload to Oh Sheet!",
                  desc: "Our AI reads every note instantly — PNG, JPG, or PDF",
                  color: "#F2C4C4",
                  icon: Upload,
                },
                {
                  num: "03",
                  title: "Edit & Export",
                  desc: "Export to MuseScore, PDF, and more in one click",
                  color: "#B8D8E8",
                  icon: FileEdit,
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="relative p-8 rounded-2xl border-2 border-[#1C1917] shadow-[6px_6px_0_#1C1917] overflow-hidden"
                  style={{ backgroundColor: step.color }}
                >
                  <div
                    className="absolute top-0 right-4 text-[12rem] font-bold opacity-10 leading-none"
                    style={{
                      fontFamily: "DM Serif Display, Georgia, serif",
                    }}
                  >
                    {step.num}
                  </div>
                  <step.icon
                    className="w-12 h-12 mb-6 relative z-10"
                    strokeWidth={1.5}
                  />
                  <h3 className="text-2xl font-semibold mb-2 relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#1C1917]/70 relative z-10">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative py-24 px-6 bg-[#F9C8D8]">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(28, 25, 23, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(28, 25, 23, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-6">
              <div className="inline-block px-4 py-2 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full text-xs font-bold tracking-widest shadow-[4px_4px_0_#1C1917]">
                REAL MUSICIANS. REAL RESULTS.
              </div>
            </div>

            <h2
              className="text-7xl font-serif font-bold mb-16 tracking-tight"
              style={{
                fontFamily: "DM Serif Display, Georgia, serif",
                letterSpacing: "-0.03em",
              }}
            >
              From the music stand
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    "I'd rather spend 5 minutes reviewing flagged errors than 30 minutes fixing silent mistakes.",
                  author: "Student | Knox College Jazz Band",
                  accent: "#F5E6A0",
                },
                {
                  quote:
                    "My handwritten arrangements used to live in a drawer. Now I can keep them with me everywhere.",
                  author: "Student | Cherry Street Combo",
                  accent: "#B8D4B0",
                },
                {
                  quote:
                    "It would take me hours to add the notes one by one and then edit them but Oh Sheet has reduced that time to minutes.",
                  author: "Music Director | Knox College",
                  accent: "#B8D8E8",
                },
              ].map((testimonial, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-2xl border-2 border-[#1C1917] shadow-[6px_6px_0_#1C1917] transform hover:-translate-y-1 transition-transform"
                  style={{ rotate: `${(i - 1) * 0.5}deg` }}
                >
                  <div
                    className="h-3 -mx-8 -mt-8 mb-6 rounded-t-xl"
                    style={{ backgroundColor: testimonial.accent }}
                  />
                  <div className="text-7xl mb-4 leading-none text-[#1C1917]/20 font-serif">
                    "
                  </div>
                  <p className="text-base mb-6 leading-relaxed">
                    {testimonial.quote}
                  </p>
                  <p className="text-xs text-[#1C1917]/60 font-medium">
                    — {testimonial.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-6 bg-[#F5E6A0] text-[#1C1917]">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(28, 25, 23, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(28, 25, 23, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2
              className="text-7xl font-serif font-bold mb-6 tracking-tight leading-tight"
              style={{
                fontFamily: "DM Serif Display, Georgia, serif",
                letterSpacing: "-0.03em",
              }}
            >
              Your scores deserve
              <br />
              to be heard.
            </h2>
            <p className="text-xl mb-8 text-[#1C1917]/70">
              Sign in to get started — free to try.
            </p>
            <Link
              to="/upload"
              className="inline-block px-8 py-4 bg-[#1C1917] text-white border-2 border-[#1C1917] rounded-full text-lg font-medium hover:translate-y-[-2px] transition-all shadow-[4px_4px_0_#1C1917] hover:shadow-[6px_6px_0_#1C1917]"
            >
              Scan Your First Score →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-[#1C1917]/10 py-8 px-6 relative z-10">
          <div className="max-w-7xl mx-auto text-center text-sm text-[#1C1917]/60">
            <p>© 2026 Oh Sheet! — Stop copying notes. Start making music.</p>
          </div>
        </footer>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');

          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .animate-marquee {
            display: inline-block;
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
