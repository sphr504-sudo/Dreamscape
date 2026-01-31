
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Download } from 'lucide-react';
import { decodeAudioData, base64ToUint8Array, pcmToWav } from '../services/geminiService';

interface AudioPlayerProps {
  base64: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const uint8 = base64ToUint8Array(base64);
      const buffer = await decodeAudioData(uint8, audioContextRef.current);
      audioBufferRef.current = buffer;
      offsetRef.current = 0;
    } catch (e) {
      console.error("Audio init error", e);
    }
  };

  useEffect(() => {
    initAudio();
    return () => stopAudio();
  }, [base64]);

  const startAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;
    
    // Resume context if suspended (common browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBufferRef.current;
    sourceNodeRef.current.connect(audioContextRef.current.destination);
    
    startTimeRef.current = audioContextRef.current.currentTime - offsetRef.current;
    sourceNodeRef.current.start(0, offsetRef.current);
    sourceNodeRef.current.onended = () => {
        // Only reset if it naturally reached the end
        if (isPlaying && sourceNodeRef.current) {
          setIsPlaying(false);
          offsetRef.current = 0;
        }
    };
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      offsetRef.current = audioContextRef.current.currentTime - startTimeRef.current;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else startAudio();
  };

  const downloadAudio = () => {
    const uint8 = base64ToUint8Array(base64);
    const wavBlob = pcmToWav(uint8, 24000);
    const url = URL.createObjectURL(wavBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aether-voice-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 transition-all animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-6">
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/40 active:scale-95"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-indigo-300">
            <span>{isPlaying ? "Streaming Neural Audio..." : "Synthesis Ready"}</span>
            <span>PCM 16-bit 24kHz</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
             <div 
               className={`h-full bg-indigo-500 transition-all ${isPlaying ? 'duration-[1s] ease-linear w-full' : 'duration-300 w-0'}`} 
             />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={downloadAudio} 
            className="p-2.5 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all" 
            title="Download Studio Quality WAV"
          >
            <Download size={20} />
          </button>
          <button 
            className="p-2.5 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            onClick={() => { stopAudio(); offsetRef.current = 0; startAudio(); }}
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
