
import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Loader2, Music, UserCheck } from 'lucide-react';
import { analyzeTextEmotions, generateEmotionalTTS } from '../services/geminiService';
import { StoryAnalysis, Voice } from '../types';

interface TTSFormProps {
  onAnalysisComplete: (analysis: StoryAnalysis) => void;
  onAudioComplete: (base64: string) => void;
  setIsProcessing: (val: boolean) => void;
  isProcessing: boolean;
}

const VOICES: Voice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const TTSForm: React.FC<TTSFormProps> = ({ 
  onAnalysisComplete, 
  onAudioComplete, 
  setIsProcessing,
  isProcessing 
}) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<Voice>('Zephyr');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Smoothly increment progress within a range
  const simulateProgress = (start: number, end: number, duration: number) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(start + (elapsed / duration) * (end - start), end);
      setProgress(Math.floor(currentProgress));
      if (currentProgress >= end) clearInterval(interval);
    }, 50);
    return interval;
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setProgress(5);
    
    let progressInterval: any;

    try {
      // Phase 1: Emotional Analysis (0% to 45%)
      progressInterval = simulateProgress(5, 45, 2000);
      const analysis = await analyzeTextEmotions(text);
      clearInterval(progressInterval);
      setProgress(45);
      onAnalysisComplete(analysis);
      
      // Phase 2: Neural Audio Synthesis (45% to 92%)
      progressInterval = simulateProgress(45, 92, 4000);
      const audioBase64 = await generateEmotionalTTS(text, analysis, selectedVoice);
      clearInterval(progressInterval);
      setProgress(95);
      
      // Phase 3: Finalizing (95% to 100%)
      setTimeout(() => {
        setProgress(100);
        onAudioComplete(audioBase64);
        setTimeout(() => setProgress(0), 1000);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setError(err.message || 'An unexpected error occurred during synthesis.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const setSample = () => {
    setText("The rain beat against the window pane, a rhythmic drum of loneliness. Yet, deep inside the small cottage, a single candle flickered with defiance, casting long shadows that seemed to dance to the melody of hope.");
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background progress track for the entire card */}
      {isProcessing && (
        <div 
          className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300 z-10" 
          style={{ width: `${progress}%` }}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Story Manuscript
          </label>
          <button 
            onClick={setSample}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            Load Example Story
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your story here... Aether will analyze emotions and narrate accordingly."
          className="w-full h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-600"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-500" /> Narrative Voice Selection
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {VOICES.map((voice) => (
            <button
              key={voice}
              onClick={() => setSelectedVoice(voice)}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                selectedVoice === voice 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {voice}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="pt-2 flex flex-col space-y-4">
        {/* Visual Progress Bar inside the button container area */}
        {isProcessing && (
           <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                <span>{progress < 45 ? 'Analyzing Emotions' : progress < 95 ? 'Neural Synthesis' : 'Finalizing Output'}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !text.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 group relative overflow-hidden"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Synthesizing... {progress}%</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Generate Emotional Speech</span>
              </>
            )}
          </button>
          
          <button
            className="px-6 py-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTSForm;
