import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PencilLine, ArrowRight, RefreshCw, AlertCircle, Link as LinkIcon, Upload as UploadIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from 'sonner';
import { SketchButton } from '@/components/ui/sketch-button';
import { RoomCard } from '@/components/ui/room-card';
import { SketchUpload } from '@/components/ui/sketch-upload';
import { chatService } from '@/lib/chat';
import { cn } from '@/lib/utils';
type AppState = 'idle' | 'sketching' | 'gallery' | 'error';
type InputMode = 'url' | 'upload';
interface Room {
  name: string;
  before: string;
  after: string;
  description: string;
}
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
export function HomePage() {
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<InputMode>('url');
  const [status, setStatus] = useState<AppState>('idle');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const handleRedesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && !url.includes('zillow.com')) {
      toast.error("Invalid URL", { description: "Please enter a valid Zillow link!" });
      return;
    }
    if (mode === 'upload' && files.length === 0) {
      toast.error("No Photos", { description: "Please upload at least one room photo!" });
      return;
    }
    setStatus('sketching');
    setError('');
    try {
      let prompt = '';
      let base64Images: string[] = [];
      if (mode === 'url') {
        prompt = `Analyze this property: ${url}. Use the mock_zillow_redesign tool and return the output as a valid JSON object following the schema: { "rooms": [{ "name": string, "before": string, "after": string, "description": string }] }. Ensure "before" contains the original image URL.`;
      } else {
        base64Images = await Promise.all(files.map(fileToBase64));
        prompt = `I've uploaded ${files.length} room photos. Please analyze their style and use the mock_upload_redesign tool. Return results strictly as JSON: { "rooms": [...] }. For the "before" field of each room, please repeat the source image context or a placeholder if tool generated.`;
      }
      const response = await chatService.sendMessage(prompt, undefined, undefined, base64Images);
      if (response.success) {
        const historyRes = await chatService.getMessages();
        const lastMsg = historyRes.data?.messages.slice().reverse().find(m => m.role === 'assistant');
        if (lastMsg) {
          const contentStr = typeof lastMsg.content === 'string' ? lastMsg.content : '';
          // Robust JSON extraction
          const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              if (data.rooms && Array.isArray(data.rooms)) {
                // Ensure fallback for missing before images
                const validatedRooms = data.rooms.map((r: any) => ({
                  ...r,
                  before: r.before || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800"
                }));
                setRooms(validatedRooms);
                setStatus('gallery');
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
              } else {
                throw new Error("The blueprint was missing its rooms!");
              }
            } catch (parseErr) {
              throw new Error("The AI's handwriting was too messy to read (JSON parse error).");
            }
          } else {
            throw new Error("No design blueprint found in the AI's response.");
          }
        }
      } else {
        throw new Error(response.error || "Magic failure!");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
      toast.error("Sketching Snafu", { description: err.message });
    }
  };
  const handleReset = () => {
    setStatus('idle');
    setRooms([]);
    setUrl('');
    setFiles([]);
  };
  return (
    <div className="min-h-screen bg-background text-charcoal">
      <ThemeToggle />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
              <div className="p-2 sketch-border bg-sketch-orange sketch-shadow-sm group-hover:rotate-6 transition-transform">
                <PencilLine size={32} />
              </div>
              <h1 className="text-4xl font-sketch">SketchMySpace</h1>
            </div>
          </header>
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto text-center space-y-12">
                <div className="space-y-6">
                  <h2 className="text-6xl md:text-8xl font-sketch leading-tight">
                    Visionary <span className="bg-sketch-orange px-4 -rotate-1 inline-block">Makeovers.</span>
                  </h2>
                  <p className="text-xl md:text-2xl font-display italic text-muted-foreground">
                    Upload a room or paste a link to see its potential.
                  </p>
                </div>
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setMode('url')} 
                      className={cn("px-6 py-2 font-sketch text-lg sketch-border transition-all", mode === 'url' ? "bg-sketch-orange sketch-shadow" : "bg-white opacity-60")}
                    >
                      <LinkIcon size={18} className="inline mr-2" /> URL
                    </button>
                    <button 
                      onClick={() => setMode('upload')} 
                      className={cn("px-6 py-2 font-sketch text-lg sketch-border transition-all", mode === 'upload' ? "bg-sketch-orange sketch-shadow" : "bg-white opacity-60")}
                    >
                      <UploadIcon size={18} className="inline mr-2" /> Photos
                    </button>
                  </div>
                  <form onSubmit={handleRedesign} className="space-y-6">
                    {mode === 'url' ? (
                      <input 
                        type="text" 
                        placeholder="Paste Zillow URL here..." 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                        className="w-full px-8 py-6 text-xl sketch-border sketch-shadow bg-white outline-none focus:ring-2 ring-sketch-orange/50 transition-all" 
                      />
                    ) : (
                      <SketchUpload files={files} setFiles={setFiles} />
                    )}
                    <SketchButton type="submit" isLoading={status === 'sketching'}>
                      Magic Redesign
                    </SketchButton>
                  </form>
                </div>
              </motion.div>
            )}
            {status === 'sketching' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 space-y-8">
                <motion.div 
                  animate={{ 
                    rotate: [0, 10, -10, 0], 
                    x: [0, 50, -50, 0],
                    y: [0, -20, 0] 
                  }} 
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} 
                  className="text-8xl"
                >
                  ✏️
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-4xl font-sketch animate-pulse">Our AI is sketching...</h3>
                  <p className="font-display italic text-muted-foreground">Adding floor-to-ceiling windows and mood lighting...</p>
                </div>
              </motion.div>
            )}
            {status === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-charcoal/10 pb-8">
                  <h2 className="text-5xl font-sketch">The Reveal</h2>
                  <SketchButton variant="secondary" onClick={handleReset}>
                    Start New Project
                  </SketchButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {rooms.map((room, i) => (
                    <RoomCard key={i} {...room} />
                  ))}
                </div>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div key="error" className="max-w-lg mx-auto text-center py-24 space-y-8 bg-white sketch-border p-12 sketch-shadow">
                <AlertCircle size={64} className="mx-auto text-red-500" />
                <div className="space-y-4">
                  <h3 className="text-4xl font-sketch">Snafu!</h3>
                  <p className="italic text-muted-foreground text-lg leading-relaxed">"{error}"</p>
                </div>
                <SketchButton onClick={handleReset} variant="primary">
                  Try Again
                </SketchButton>
              </motion.div>
            )}
          </AnimatePresence>
          <footer className="mt-24 pt-12 border-t-2 border-charcoal/10 text-center space-y-6">
            <p className="font-sketch text-2xl opacity-60">Created with 🧡 for dreamers.</p>
            <div className="max-w-2xl mx-auto text-sm opacity-60 bg-charcoal text-white p-6 sketch-border sketch-shadow-sm">
              <p className="font-bold mb-2 uppercase tracking-widest text-xs">A Note for Visionaries:</p>
              This project utilizes advanced AI capabilities. Please note there is a limit on the number of requests that can be made to the AI servers across all user apps in a given time period. Results are whimsical, artistic interpretations.
            </div>
          </footer>
        </div>
      </div>
      <Toaster richColors position="bottom-center" />
    </div>
  );
}