
import React from 'react';
import { Brain, Activity, User, Heart, Star, CloudRain, Zap } from 'lucide-react';
import { StoryAnalysis } from '../types';

interface TextAnalysisPanelProps {
  analysis: StoryAnalysis | null;
  isProcessing: boolean;
}

const getEmotionIcon = (emotion: string) => {
  const e = emotion.toLowerCase();
  if (['happiness', 'gratitude', 'love', 'excitement', 'pride', 'relief', 'amusement', 'euphoria'].includes(e)) 
    return <Star className="w-3 h-3 text-amber-400" />;
  if (['sadness', 'anger', 'fear', 'disgust', 'shame', 'jealousy', 'boredom', 'frustration', 'bitterness', 'melancholy'].includes(e)) 
    return <CloudRain className="w-3 h-3 text-blue-400" />;
  return <Zap className="w-3 h-3 text-purple-400" />;
};

const TextAnalysisPanel: React.FC<TextAnalysisPanelProps> = ({ analysis, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center animate-pulse">
        <Brain className="w-12 h-12 text-indigo-500/50 mb-4" />
        <h3 className="text-xl font-bold text-gray-500">Neural Decoding In Progress</h3>
        <p className="text-gray-600 mt-2 text-sm">Mapping complex emotional trajectories across 28 distinct markers...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center border-dashed">
        <Activity className="w-12 h-12 text-gray-700 mb-4" />
        <h3 className="text-xl font-bold text-gray-600">Emotional Intelligence Engine</h3>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">Input a story to see deep emotional profiling including Positive, Negative, Complex, and Wistful states.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-indigo-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Semantic Analysis</h3>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed italic border-l-2 border-indigo-500/50 pl-4 py-1 bg-white/[0.02] rounded-r-lg">
          "{analysis.summary}"
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="text-rose-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Emotional Dynamic Spectrum</h3>
        </div>
        <div className="space-y-5">
          {analysis.emotions.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300 flex items-center gap-2">
                  {getEmotionIcon(item.emotion)}
                  <span className="uppercase tracking-tighter">{item.emotion}</span>
                  <span className="text-[10px] text-gray-500 lowercase font-normal">({item.tone})</span>
                </span>
                <span className="text-indigo-400 font-mono">{item.intensity * 10}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-rose-500 rounded-full transition-all duration-1000"
                  style={{ width: `${item.intensity * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-amber-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Vocal Synthesis Config</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 p-3 rounded-lg border border-white/5">
            <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Recommended Voice</span>
            <span className="text-xs font-mono text-indigo-300">{analysis.emotions[0]?.suggestedVoice || 'Zephyr'}</span>
          </div>
          <div className="bg-black/30 p-3 rounded-lg border border-white/5">
            <span className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Narration Mode</span>
            <span className="text-xs text-white truncate">{analysis.narrationStyle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnalysisPanel;
