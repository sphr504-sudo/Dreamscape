
import React, { useState } from 'react';
import { Sparkles, Loader2, Music, Users, Info, Brain, AudioLines } from 'lucide-react';
import { analyzeScript, synthesizeSegment } from '../services/geminiService';
import { ScriptAnalysis, CharacterDef, Voice } from '../types';

interface TTSFormProps {
  onAnalysisComplete: (analysis: ScriptAnalysis) => void;
  onAudioComplete: (blobs: string[]) => void;
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
  const [registry, setRegistry] = useState<CharacterDef[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [currentStep, setCurrentStep] = useState<{ current: number; total: number } | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing Neural Engine...');
    setCurrentStep(null);

    try {
      // 1. Structural Analysis
      setStatus('Analyzing Script Architecture...');
      setProgress(10);
      const analysis = await analyzeScript(text);
      setRegistry(analysis.characters);
      onAnalysisComplete(analysis);
      setProgress(25);

      // 2. Sequential Synthesis
      const audioParts: string[] = [];
      const total = analysis.segments.length;
      setCurrentStep({ current: 0, total });

      for (let i = 0; i < total; i++) {
        const seg = analysis.segments[i];
        const char = analysis.characters.find(c => c.id === seg.characterId) || analysis.characters[0];
        
        setCurrentStep({ current: i + 1, total });
        setStatus(`Synthesizing Segment: ${char.name}`);
        
        const base64 = await synthesizeSegment(seg, char);
        audioParts.push(base64);
        
        const currentProgress = 25 + ((i + 1) / total) * 75;
        setProgress(Math.floor(currentProgress));
      }

      onAudioComplete(audioParts);
      setStatus('Performance Finalized');
      setTimeout(() => {
        setProgress(0);
        setCurrentStep(null);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatus('Engine Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCharacterVoice = (charId: string, voice: Voice) => {
    setRegistry(prev => prev.map(c => c.id === charId ? { ...c, baseVoice: voice } : c));
  };

  const setSample = () => {
    setText(`Narrator: The old manor stood silent, but the air felt heavy.
Arthur: (fearful) Is someone there? I can hear your breathing.
Ghost: (whispering) I have been waiting for you, Arthur. For eighty years.
Baby: (giggling) Da-da!`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Synthesis Overlay Loader */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-8 border border-indigo-500/20 animate-in fade-in zoom-in duration-300">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-white/5 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-10 h-10 text-indigo-400 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-4 w-full max-w-xs">
            <h3 className="text-xl font-bold text-white tracking-tight">Generating Audio</h3>
            <p className="text-indigo-400 text-xs font-mono uppercase tracking-[0.2em]">{status}</p>
            
            {currentStep && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <AudioLines className="w-4 h-4" />
                <span className="text-sm font-medium">Part {currentStep.current} of {currentStep.total}</span>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                <span>PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Script Manuscript
          </label>
          <button 
            onClick={setSample} 
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            disabled={isProcessing}
          >
            Load Multi-Character Sample
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Format: Character Name: Dialogue line..."
          disabled={isProcessing}
          className="w-full h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-gray-600 disabled:opacity-50"
        />

        <button
          onClick={handleGenerate}
          disabled={isProcessing || !text.trim()}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg group active:scale-[0.98]"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          <span>Generate Neural Performance</span>
        </button>
      </div>

      {registry.length > 0 && !isProcessing && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-indigo-500 w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Character Voice Registry</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registry.map(char => (
              <div key={char.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3 group hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{char.name}</h4>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">{char.ageGroup} • {char.gender}</span>
                  </div>
                  <div className="relative group/info">
                    <Info className="w-3 h-3 text-gray-600 cursor-help" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[10px] text-gray-400 opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                      {char.traits}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {VOICES.map(v => (
                    <button
                      key={v}
                      onClick={() => updateCharacterVoice(char.id, v)}
                      className={`text-[10px] px-2 py-1 rounded transition-all ${char.baseVoice === v ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TTSForm;
