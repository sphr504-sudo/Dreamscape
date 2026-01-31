
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Download } from 'lucide-react';
import { decodeAudioData } from '../services/geminiService';

interface AudioPlayerProps {
  base64: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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
      
      const bytes = atob(base64);
      const arrayBuffer = new ArrayBuffer(bytes.length);
      const uint8 = new Uint8Array(arrayBuffer);
      for (let i = 0; i < bytes.length; i++) uint8[i] = bytes.charCodeAt(i);
      
      const buffer = await decodeAudioData(uint8, audioContextRef.current);
      audioBufferRef.current = buffer;
      setProgress(0);
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
    
    sourceNodeRef.current = audioContextRef.current.createBufferSource();
    sourceNodeRef.current.buffer = audioBufferRef.current;
    sourceNodeRef.current.connect(audioContextRef.current.destination);
    
    startTimeRef.current = audioContextRef.current.currentTime - offsetRef.current;
    sourceNodeRef.current.start(0, offsetRef.current);
    sourceNodeRef.current.onended = () => {
        if (isPlaying) {
            setIsPlaying(false);
            offsetRef.current = 0;
            setProgress(0);
        }
    };
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
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
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${base64}`;
    link.download = "aether-speech.wav";
    link.click();
  };

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-6">
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/40"
        >
          {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-indigo-300">
            <span>{isPlaying ? "Playing Neural Synthesis..." : "Audio Ready"}</span>
            <span>PCM 24kHz</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-500 transition-all duration-300" 
               style={{ width: `${isPlaying ? '100%' : '0%'}` }} 
             />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={downloadAudio} className="p-2 text-gray-400 hover:text-white transition-colors" title="Download WAV">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Volume2 className="w-5 h-5" />
          </button>
          <button onClick={() => { stopAudio(); offsetRef.current = 0; startAudio(); }} className="p-2 text-gray-400 hover:text-white transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
