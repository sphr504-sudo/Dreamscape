
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, Loader2, Volume2 } from 'lucide-react';
import { decodeAudioData, base64ToUint8Array, pcmToWav } from '../services/geminiService';

interface AudioPlayerProps {
  blobs: string[]; // List of base64 segments
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ blobs }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);

  const loadAllBuffers = async () => {
    if (blobs.length === 0) return;
    
    setIsDecoding(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const buffers = await Promise.all(
        blobs.filter(b => !!b).map(b => decodeAudioData(base64ToUint8Array(b), audioContextRef.current!))
      );
      audioBuffersRef.current = buffers;
      setCurrentIndex(0);
    } catch (e) {
      console.error("Aether: Buffer load error", e);
    } finally {
      setIsDecoding(false);
    }
  };

  useEffect(() => {
    loadAllBuffers();
    return () => stopAudio();
  }, [blobs]);

  const playSegment = async (index: number) => {
    if (!audioContextRef.current || !audioBuffersRef.current[index]) {
      setIsPlaying(false);
      return;
    }

    // Ensure context is running (required for browser security)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      try { sourceNodeRef.current.stop(); } catch(e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffersRef.current[index];
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      if (index + 1 < audioBuffersRef.current.length) {
        setCurrentIndex(index + 1);
        playSegment(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setCurrentIndex(index);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else playSegment(currentIndex);
  };

  const downloadFullPerformance = async () => {
    const validBlobs = blobs.filter(b => !!b);
    if (validBlobs.length === 0) return;

    const allPcm: Uint8Array[] = validBlobs.map(b => base64ToUint8Array(b));
    const totalLength = allPcm.reduce((acc, val) => acc + val.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of allPcm) {
      combined.set(arr, offset);
      offset += arr.length;
    }

    const wavBlob = pcmToWav(combined, 24000);
    const url = URL.createObjectURL(wavBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aether-performance-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 transition-all animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <button
            onClick={togglePlay}
            disabled={isDecoding || blobs.length === 0}
            className="w-16 h-16 bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-800 rounded-full flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/40 active:scale-95 z-10 relative"
          >
            {isDecoding ? <Loader2 className="w-7 h-7 animate-spin" /> : isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
          </button>
          {isPlaying && (
            <div className="absolute inset-[-4px] border-2 border-indigo-500/50 rounded-full animate-ping pointer-events-none" />
          )}
        </div>

        <div className="flex-1 w-full space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {isDecoding ? 'Decoding Neural Audio...' : isPlaying ? `Playing Scene Part ${currentIndex + 1}` : 'Performance Studio Ready'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">{blobs.length} Neural Segments</span>
          </div>
          
          <div className="h-3 bg-black/40 rounded-full flex gap-1 p-[2px] overflow-hidden">
            {blobs.map((_, i) => (
              <div 
                key={i} 
                className={`h-full rounded-full transition-all duration-500 ${
                  i === currentIndex && isPlaying ? 'bg-indigo-400 flex-[3] shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 
                  i < currentIndex ? 'bg-indigo-900/50 flex-1' : 'bg-white/5 flex-1'
                }`} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={downloadFullPerformance} 
            disabled={isDecoding || blobs.length === 0}
            className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 group" 
            title="Export Studio Quality WAV"
          >
            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
          <button 
            onClick={() => { stopAudio(); setCurrentIndex(0); playSegment(0); }} 
            disabled={isDecoding || blobs.length === 0}
            className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
            title="Replay from Start"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
