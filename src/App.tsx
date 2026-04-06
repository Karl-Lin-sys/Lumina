/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ChatInterface } from './components/ChatInterface';
import { analyzeImageAndWriteStory, generateSpeech, createChatSession } from './lib/gemini';
import { Loader2, Play, Square, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [image, setImage] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(null);
  const [story, setStory] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  const handleImageSelected = async (base64: string, mimeType: string, dataUrl: string) => {
    setImage({ base64, mimeType, dataUrl });
    setIsAnalyzing(true);
    setStory('');
    setAudioUrl(null);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const generatedStory = await analyzeImageAndWriteStory(base64, mimeType);
      setStory(generatedStory);
      setChatSession(createChatSession());
    } catch (error) {
      console.error("Error generating story:", error);
      setStory("An error occurred while analyzing the image and writing the story. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReadAloud = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (!story) return;

    setIsGeneratingAudio(true);
    try {
      const base64Audio = await generateSpeech(story);
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Play immediately after generating
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <>
      <div className="atmosphere"></div>
      
      <main className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center">
        <header className="w-full max-w-7xl mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-serif tracking-wide text-white/90">Lumina</h1>
          <div className="text-xs uppercase tracking-widest text-white/40 font-medium">Creative Writing Interface</div>
        </header>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Column: Image & Chat */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <div className="glass-panel p-2 flex-shrink-0 h-[40%] relative overflow-hidden group">
              {!image ? (
                <ImageUploader onImageSelected={handleImageSelected} />
              ) : (
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <img 
                    src={image.dataUrl} 
                    alt="Inspiration" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => {
                      setImage(null);
                      setStory('');
                      setChatSession(null);
                      setAudioUrl(null);
                      if (audioRef.current) audioRef.current.pause();
                    }}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </div>

            <div className="glass-panel flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ff4e00]"></div>
                <h2 className="text-sm font-medium uppercase tracking-wider text-white/70">Co-Author Chat</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                {chatSession ? (
                  <ChatInterface chatSession={chatSession} />
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 text-sm px-8 text-center">
                    Upload an image to start collaborating with your AI co-author.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Story */}
          <div className="lg:col-span-7 glass-panel flex flex-col h-[calc(100vh-8rem)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[rgba(10,5,2,0.8)] to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 pt-16 pb-32 relative z-0">
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-white/50"
                  >
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#ff4e00]" />
                    <p className="font-serif text-xl italic">Observing the world...</p>
                  </motion.div>
                ) : story ? (
                  <motion.div 
                    key="story"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="story-text"
                  >
                    {story.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex items-center justify-center text-white/20 font-serif text-2xl italic text-center max-w-md mx-auto"
                  >
                    The page is blank. Provide an image to begin the tale.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[rgba(10,5,2,0.9)] to-transparent z-10 pointer-events-none"></div>
            
            {/* Audio Controls */}
            <AnimatePresence>
              {story && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                  <button
                    onClick={handleReadAloud}
                    disabled={isGeneratingAudio}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isPlaying ? (
                      <Square className="w-4 h-4 fill-current" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium tracking-wide">
                      {isGeneratingAudio ? 'Synthesizing Voice...' : isPlaying ? 'Stop Reading' : 'Read Aloud'}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
    </>
  );
}
