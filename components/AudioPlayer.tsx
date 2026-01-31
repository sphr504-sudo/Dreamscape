
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Volume2, RotateCcw } from 'lucide-react';
import { ScriptAnalysis } from '../types';
import { mergeAudioSegments } from '../services/geminiService';

interface AudioPlayerProps {
  analysis: ScriptAnalysis | null;
  audioParts: string[]; // Base64 PCM segments
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ analysis, audioParts }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
    }
    setIsPlaying(false);
  };

  const playSegment = async (index: number) => {
    if (!audioParts[index]) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const base64 = audioParts[index];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

    const dataInt16 = new Int16Array(bytes.buffer);
    const audioBuffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (index + 1 < audioParts.length) {
        playSegment(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    setCurrentIndex(index);
    setIsPlaying(true);
    currentSourceRef.current = source;
    source.start(0);
  };

  const handleDownload = () => {
    if (audioParts.length === 0) return;
    const blob = mergeAudioSegments(audioParts);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aether_Performance_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  if (audioParts.length === 0) return null;

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 transition-all animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <button
          onClick={() => isPlaying ? stopAudio() : playSegment(currentIndex)}
          className="w-16 h-16 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/40 active:scale-95 z-10"
        >
          {isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 w-full space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {isPlaying ? `Part ${currentIndex + 1} of ${audioParts.length}` : 'Performance Rendered'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">24kHz MONO WAV</span>
          </div>
          
          <div className="h-2 bg-black/40 rounded-full overflow-hidden flex gap-0.5">
            {audioParts.map((_, i) => (
              <div key={i} className={`h-full transition-all duration-300 ${i === currentIndex && isPlaying ? 'bg-indigo-400 flex-[4]' : i < currentIndex ? 'bg-indigo-900 flex-1' : 'bg-white/5 flex-1'}`} />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { stopAudio(); playSegment(0); }} 
            className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white border border-white/5"
            title="Replay"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Download size={20} />
            Download Performance
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
