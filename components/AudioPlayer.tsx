
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, AudioLines } from 'lucide-react';
import { ScriptAnalysis, DialogueSegment } from '../types';

interface AudioPlayerProps {
  analysis: ScriptAnalysis | null;
  triggerPlay: number; // Increment to force play
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ analysis, triggerPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const synthesisRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = () => {
    synthesisRef.current.cancel();
    setIsPlaying(false);
  };

  const playSegment = (index: number) => {
    if (!analysis || index >= analysis.segments.length) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    const seg = analysis.segments[index];
    const char = analysis.characters.find(c => c.id === seg.characterId);
    const utterance = new SpeechSynthesisUtterance(seg.text);

    // Voice Selection
    const voices = synthesisRef.current.getVoices();
    const voice = voices.find(v => v.name === char?.assignedVoiceName) || voices[0];
    utterance.voice = voice;

    // Emotional Modulation Logic
    // 1. Pitch: Children/Ghosts = higher, Elders/Monsters = lower
    let pitch = 1.0;
    if (char?.ageGroup === 'child' || char?.ageGroup === 'newborn') pitch = 1.4;
    if (char?.ageGroup === 'elder') pitch = 0.8;
    if (char?.ageGroup === 'ghost' || char?.ageGroup === 'paranormal') pitch = 0.6;
    
    // Adjust pitch further based on emotion
    if (seg.emotion.toLowerCase().includes('happy') || seg.emotion.toLowerCase().includes('fear')) pitch += 0.2;
    if (seg.emotion.toLowerCase().includes('sad') || seg.emotion.toLowerCase().includes('angry')) pitch -= 0.1;
    
    // 2. Rate: Intensity affects speed
    // Intensity 1 = slow (0.7), Intensity 10 = fast (1.3)
    let rate = 0.8 + (seg.intensity / 10) * 0.5;
    if (seg.emotion.toLowerCase().includes('whisper')) rate = 0.6;

    utterance.pitch = Math.max(0.1, Math.min(2.0, pitch));
    utterance.rate = Math.max(0.1, Math.min(2.0, rate));
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentIndex(index);
    };

    utterance.onend = () => {
      if (index + 1 < analysis.segments.length) {
        playSegment(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    currentUtteranceRef.current = utterance;
    synthesisRef.current.speak(utterance);
  };

  useEffect(() => {
    if (triggerPlay > 0 && analysis) {
      stopAudio();
      playSegment(0);
    }
    return () => stopAudio();
  }, [triggerPlay]);

  if (!analysis) return null;

  return (
    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 transition-all animate-in fade-in duration-500">
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
                {isPlaying ? `Performing: ${analysis.characters.find(c => c.id === analysis.segments[currentIndex].characterId)?.name}` : 'Local Synthesis Ready'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">{analysis.segments.length} Performance Segments</span>
          </div>
          
          <div className="h-3 bg-black/40 rounded-full flex gap-1 p-[2px] overflow-hidden">
            {analysis.segments.map((_, i) => (
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

        <button 
          onClick={() => { stopAudio(); playSegment(0); }} 
          className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white border border-white/5"
          title="Replay from Start"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
