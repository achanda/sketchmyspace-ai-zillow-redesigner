import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PencilLine, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from 'sonner';
import { SketchButton } from '@/components/ui/sketch-button';
import { RoomCard } from '@/components/ui/room-card';
import { chatService } from '@/lib/chat';
type AppState = 'idle' | 'sketching' | 'gallery' | 'error';
interface Room {
  name: string;
  before: string;
  after: string;
  description: string;
}
export function HomePage() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<AppState>('idle');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const handleRedesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('zillow.com')) {
      toast.error("Oops!", { description: "Please enter a valid Zillow listing URL!" });
      return;
    }
    setStatus('sketching');
    setError('');
    try {
      // Hidden prompt instructions for structured JSON response
      const prompt = `Please use the mock_zillow_redesign tool to analyze this URL: ${url}. 
      Return the results as a JSON object with a "rooms" array, where each room has "name", "before", "after", and "description".
      Strictly return ONLY the JSON string.`;
      const response = await chatService.sendMessage(prompt);
      if (response.success) {
        // Find the tool result in messages or simulate parsing the last assistant message
        // In this template, the tool result content is usually embedded in the last response
        const messagesRes = await chatService.getMessages();
        const lastMsg = messagesRes.data?.messages.slice().reverse().find(m => m.role === 'assistant');
        if (lastMsg) {
          try {
            // Find JSON in the content
            const jsonMatch = lastMsg.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[0]);
              setRooms(data.rooms);
              setStatus('gallery');
              confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F6AD55', '#2D3748', '#FDFBF7']
              });
            } else {
              throw new Error("Could not find design details in the magic ink!");
            }
          } catch (e) {
            console.error("Parse error:", e);
            throw new Error("The AI got a bit too creative. Let's try again!");
          }
        }
      } else {
        throw new Error(response.error || "The magic failed! Check your connection.");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
      toast.error("Sketching Error", { description: err.message });
    }
  };
  const handleReset = () => {
    setStatus('idle');
    setUrl('');
    setRooms([]);
  };
  return (
    <div className="min-h-screen bg-background text-charcoal selection:bg-sketch-orange/30">
      <ThemeToggle />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="py-8 md:py-12 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleReset}>
            <div className="p-2 sketch-border bg-sketch-orange sketch-shadow-sm group-hover:rotate-6 transition-transform">
              <PencilLine size={32} />
            </div>
            <h1 className="text-4xl font-sketch">SketchMySpace</h1>
          </div>
        </header>
        <main className="py-8 md:py-12 lg:py-16">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-3xl mx-auto text-center space-y-12"
              >
                <div className="space-y-6">
                  <h2 className="text-6xl md:text-8xl font-sketch leading-tight">
                    Dream big with <br/> 
                    <span className="bg-sketch-orange px-4 -rotate-1 inline-block">your new home.</span>
                  </h2>
                  <p className="text-xl md:text-2xl font-medium text-muted-foreground italic">
                    Paste a Zillow URL and let our AI sketch the future of your space.
                  </p>
                </div>
                <form onSubmit={handleRedesign} className="relative group max-w-2xl mx-auto">
                  <input
                    type="text"
                    placeholder="https://www.zillow.com/homedetails/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-8 py-6 text-xl sketch-border sketch-shadow focus:outline-none focus:ring-4 focus:ring-sketch-orange/20 transition-all placeholder:text-muted-foreground/50 bg-white"
                  />
                  <SketchButton 
                    type="submit"
                    className="mt-6 md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 md:mt-0"
                  >
                    Magic Redesign
                  </SketchButton>
                </form>
                <div className="flex justify-center gap-8 pt-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="text-sketch-orange" />
                    <span>AI-Powered Insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowRight className="text-sketch-orange" />
                    <span>Instant Previews</span>
                  </div>
                </div>
              </motion.div>
            )}
            {status === 'sketching' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center space-y-12 py-24"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      x: [0, 50, -50, 50, 0],
                      y: [0, -20, 20, -20, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-8xl"
                  >
                    ✏️
                  </motion.div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 bg-charcoal/10 rounded-full blur-sm" />
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-5xl font-sketch animate-pulse">Sketching in progress...</h3>
                  <p className="text-xl text-muted-foreground font-medium italic">
                    Our AI architects are sharpening their pencils and brewing coffee.
                  </p>
                </div>
              </motion.div>
            )}
            {status === 'gallery' && (
              <motion.div 
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-charcoal/10 pb-8">
                  <div className="space-y-2">
                    <span className="text-sketch-orange font-bold uppercase tracking-widest text-sm">Design Reveal</span>
                    <h2 className="text-5xl md:text-6xl font-sketch">Your Future Home</h2>
                  </div>
                  <SketchButton variant="secondary" onClick={handleReset} className="flex items-center gap-2">
                    <RefreshCw size={20} /> Try Another Space
                  </SketchButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                  {rooms.map((room, idx) => (
                    <RoomCard key={idx} {...room} />
                  ))}
                </div>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto text-center py-24 space-y-8"
              >
                <div className="flex justify-center">
                  <div className="p-6 bg-red-100 sketch-border sketch-shadow">
                    <AlertCircle size={64} className="text-red-500" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-sketch">Sketching Snafu!</h3>
                  <p className="text-xl text-muted-foreground italic">"{error}"</p>
                </div>
                <SketchButton onClick={handleReset}>Try Again</SketchButton>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <footer className="py-12 mt-12 border-t-2 border-charcoal/10 text-center space-y-6">
          <p className="font-sketch text-2xl text-muted-foreground">
            Created with 🧡 for the dreamers.
          </p>
          <div className="max-w-2xl mx-auto p-4 sketch-border bg-charcoal text-white text-sm">
            <p>
              <strong>Note:</strong> SketchMySpace is an AI-powered visualization tool. While we strive for magic, results are artistic interpretations. 
              There is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period.
            </p>
          </div>
          <p className="text-muted-foreground/60 text-xs">Powered by Cloudflare Agents & MCP</p>
        </footer>
      </div>
      <Toaster richColors position="bottom-center" />
    </div>
  );
}