
import React from 'react';
import { Brain, Heart, Ghost, Baby, User, Star, CloudRain, Zap, ChevronRight } from 'lucide-react';
import { ScriptAnalysis, CharacterType } from '../types';

interface TextAnalysisPanelProps {
  analysis: ScriptAnalysis | null;
  isProcessing: boolean;
}

const getTypeIcon = (type: CharacterType) => {
  switch (type) {
    case 'ghost':
    case 'paranormal': return <Ghost className="w-4 h-4 text-purple-400" />;
    case 'newborn': return <Baby className="w-4 h-4 text-pink-400" />;
    case 'child': return <Star className="w-4 h-4 text-amber-400" />;
    case 'elder': return <CloudRain className="w-4 h-4 text-blue-400" />;
    default: return <User className="w-4 h-4 text-gray-400" />;
  }
};

const TextAnalysisPanel: React.FC<TextAnalysisPanelProps> = ({ analysis, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center animate-pulse">
        <Brain className="w-12 h-12 text-indigo-500/50 mb-4" />
        <h3 className="text-xl font-bold text-gray-500">Synthesizing Performance</h3>
        <p className="text-gray-600 mt-2 text-sm">Orchestrating multi-character voice mapping and emotional trajectory...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center border-dashed">
        <Brain className="w-12 h-12 text-gray-700 mb-4" />
        <h3 className="text-xl font-bold text-gray-600">Neural Script Analysis</h3>
        <p className="text-gray-500 mt-2 max-w-xs text-sm">Analyze a script to detect characters, ages, genders, and emotions. Supports supernatural and infant voice types.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="text-indigo-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Story Objective</h3>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed italic border-l-2 border-indigo-500/50 pl-4 py-1 bg-white/[0.02] rounded-r-lg">
          "{analysis.summary}"
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="text-rose-500 w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Dialogue Timeline</h3>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {analysis.segments.map((seg, idx) => {
            const char = analysis.characters.find(c => c.id === seg.characterId);
            return (
              <div key={idx} className="bg-black/20 p-3 rounded-lg border border-white/5 relative group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(char?.ageGroup || 'adult')}
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{char?.name}</span>
                  </div>
                  <span className="text-[9px] text-gray-600 italic uppercase">{seg.emotion}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{seg.text}</p>
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3 h-3 text-gray-700" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TextAnalysisPanel;
