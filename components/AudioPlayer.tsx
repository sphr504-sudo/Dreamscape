
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download, FastForward } from 'lucide-react';
import { decodeAudioData, base64ToUint8Array, pcmToWav } from '../services/geminiService';

interface AudioPlayerProps {
  blobs: string[]; // List of base64 segments
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ blobs }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);

  const loadAllBuffers = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const buffers = await Promise.all(
      blobs.map(b => decodeAudioData(base64ToUint8Array(b), audioContextRef.current!))
    );
    audioBuffersRef.current = buffers;
    setCurrentIndex(0);
  };

  useEffect(() => {
    loadAllBuffers();
    return () => stopAudio();
  }, [blobs]);

  const playSegment = (index: number) => {
    if (!audioContextRef.current || !audioBuffersRef.current[index]) return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
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
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) stopAudio();
    else playSegment(currentIndex);
  };

  const downloadFullPerformance = async () => {
    // Combine all raw PCM data
    const allPcm: Uint8Array[] = blobs.map(b => base64ToUint8Array(b));
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
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
      <div className="flex items-center gap-6">
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center text-white transition-all shadow-lg shadow-indigo-500/40"
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            <span>Performance Queue</span>
            <span>Segment {currentIndex + 1} / {blobs.length}</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full flex gap-1 p-[2px]">
            {blobs.map((_, i) => (
              <div 
                key={i} 
                className={`h-full rounded-full transition-all duration-300 ${
                  i === currentIndex ? 'bg-indigo-400 flex-[2]' : 
                  i < currentIndex ? 'bg-indigo-900 flex-1' : 'bg-white/5 flex-1'
                }`} 
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={downloadFullPerformance} className="p-2.5 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all" title="Download Full Wav">
            <Download size={18} />
          </button>
          <button onClick={() => { stopAudio(); setCurrentIndex(0); }} className="p-2.5 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
