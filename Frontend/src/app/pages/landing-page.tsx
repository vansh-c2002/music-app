import { Upload, Music, Play, Edit3 } from "lucide-react";
import { Link } from "react-router";
import { Navbar } from "../components/navbar";
import { motion } from "motion/react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-6xl font-bold text-primary mb-6 leading-tight"
          >
            Turn Sheet Music into
            <span className="block text-accent mt-2">Interactive Sound</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Upload your sheet music and instantly play, edit, and interact with every note. 
            Perfect for musicians, composers, and music learners.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <Link 
              to="/upload"
              className="px-8 py-4 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Get Started
            </Link>
            <button className="px-8 py-4 bg-card border-2 border-border text-card-foreground rounded-lg hover:border-accent transition-all">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Illustration Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-card rounded-2xl shadow-2xl p-12 border border-border"
          >
            <div className="flex items-center justify-between gap-8">
              <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg mb-2">Upload</h3>
                <p className="text-sm text-muted-foreground">Drop your sheet music</p>
              </div>
              
              <div className="w-12 h-0.5 bg-accent"></div>
              
              <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg mb-2">Process</h3>
                <p className="text-sm text-muted-foreground">AI analyzes your music</p>
              </div>
              
              <div className="w-12 h-0.5 bg-accent"></div>
              
              <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg mb-2">Play</h3>
                <p className="text-sm text-muted-foreground">Listen & interact</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">
            Everything you need to master music
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                title: "Interactive Playback",
                description: "Watch notes highlight as they play. Control tempo and loop sections for practice."
              },
              {
                icon: Edit3,
                title: "Smart Editing",
                description: "Edit any note with intuitive tools. Change pitch, duration, and dynamics instantly."
              },
              {
                icon: Music,
                title: "AI-Powered",
                description: "Get intelligent suggestions to fix notation errors and improve your scores."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-xl border border-border hover:border-accent transition-all hover:shadow-lg"
              >
                <feature.icon className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Ready to transform your sheet music?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of musicians using SheetFlow every day
          </p>
          <Link 
            to="/upload"
            className="inline-flex items-center gap-2 px-10 py-5 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-all hover:scale-105 shadow-xl"
          >
            <Upload className="w-6 h-6" />
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2026 SheetFlow. Transform the way you interact with music.</p>
        </div>
      </footer>
    </div>
  );
}
