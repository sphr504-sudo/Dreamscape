
import React, { useState, useEffect } from 'react';
import { Music, Users, Info, Brain, Fingerprint, PlayCircle, Sliders, MessageSquareQuote, AlertCircle } from 'lucide-react';
import { analyzeScript } from '../services/geminiService';
import { ScriptAnalysis, CharacterDef, DialogueSegment } from '../types';

interface TTSFormProps {
  onAnalysisComplete: (analysis: ScriptAnalysis) => void;
  setIsProcessing: (val: boolean) => void;
  isProcessing: boolean;
  onPerformRequest: () => void;
}

const TTSForm: React.FC<TTSFormProps> = ({ 
  onAnalysisComplete, 
  setIsProcessing,
  isProcessing,
  onPerformRequest
}) => {
  const [text, setText] = useState('');
  const [localAnalysis, setLocalAnalysis] = useState<ScriptAnalysis | null>(null);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setBrowserVoices(voices.filter(v => v.lang.startsWith('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setErrorMsg(null);
    setStatus('Analyzing Script Emotion...');

    try {
      const analysis = await analyzeScript(text, (msg) => setStatus(msg));
      
      // Auto-assign random voices initially
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
      analysis.characters = analysis.characters.map((c, i) => ({
        ...c,
        assignedVoiceName: voices[i % voices.length]?.name
      }));

      setLocalAnalysis(analysis);
      onAnalysisComplete(analysis);
      setStatus('Script Analyzed');
      setIsProcessing(false);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setErrorMsg(err.message || "Failed to analyze script.");
      setIsProcessing(false);
    }
  };

  const updateCharacterVoice = (charId: string, voiceName: string) => {
    if (!localAnalysis) return;
    const updated = {
      ...localAnalysis,
      characters: localAnalysis.characters.map(c => c.id === charId ? { ...c, assignedVoiceName: voiceName } : c)
    };
    setLocalAnalysis(updated);
    onAnalysisComplete(updated);
  };

  const updateSegmentIntensity = (index: number, intensity: number) => {
    if (!localAnalysis) return;
    const updatedSegments = [...localAnalysis.segments];
    updatedSegments[index] = { ...updatedSegments[index], intensity };
    const updated = { ...localAnalysis, segments: updatedSegments };
    setLocalAnalysis(updated);
    onAnalysisComplete(updated);
  };

  const setSample = () => {
    setText(`Narrator: The old manor stood silent, but the air felt heavy.
Arthur: (fearful) Is someone there? I can hear your breathing.
Ghost: (whispering) I have been waiting for you, Arthur. For eighty years.`);
    setLocalAnalysis(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6 relative">
      {isProcessing && (
        <div className="absolute inset-0 z-[60] bg-[#070707]/95 backdrop-blur-2xl rounded-3xl flex flex-col items-center justify-center p-8 border border-white/10 animate-in fade-in duration-300">
          <Brain className="w-16 h-16 text-indigo-400 animate-pulse mb-6" />
          <h3 className="text-xl font-bold text-white tracking-tight">Emotional Intelligence Active</h3>
          <p className="text-indigo-400 text-xs font-mono uppercase tracking-[0.3em] mt-2">{status}</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest">Analysis Error</h4>
            <p className="text-xs text-red-400/80 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
            <MessageSquareQuote className="w-4 h-4" /> Script Manuscript
          </label>
          <button onClick={setSample} className="text-[10px] text-indigo-400/60 hover:text-indigo-300 transition-colors font-bold uppercase tracking-widest" disabled={isProcessing}>
            Load Sample
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); if (localAnalysis) setLocalAnalysis(null); }}
          placeholder="Narrator: Deep in the forest...&#10;Voice: Who goes there?"
          className="w-full h-56 bg-black/40 border border-white/5 rounded-2xl p-6 text-white text-lg focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all placeholder:text-gray-700 leading-relaxed custom-scrollbar"
        />

        {!localAnalysis ? (
          <button
            onClick={handleAnalyze}
            disabled={isProcessing || !text.trim()}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            <Fingerprint className="w-6 h-6" />
            <span className="text-lg uppercase tracking-widest">Analyze Script</span>
          </button>
        ) : (
          <button
            onClick={onPerformRequest}
            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] animate-pulse-subtle"
          >
            <PlayCircle className="w-6 h-6" />
            <span className="text-lg uppercase tracking-widest">Perform Scene</span>
          </button>
        )}
      </div>

      {localAnalysis && !isProcessing && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <Users className="text-indigo-400 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Cast Voice Assignment</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localAnalysis.characters.map(char => (
                <div key={char.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">{char.name}</h4>
                    <span className="text-[9px] text-indigo-400/70 font-bold uppercase tracking-widest">{char.ageGroup}</span>
                  </div>
                  <select 
                    value={char.assignedVoiceName} 
                    onChange={(e) => updateCharacterVoice(char.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-[10px] text-gray-300 outline-none"
                  >
                    {browserVoices.map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <Sliders className="text-sky-400 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Emotional Fine-Tuning</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {localAnalysis.segments.map((seg, idx) => {
                const char = localAnalysis.characters.find(c => c.id === seg.characterId);
                return (
                  <div key={idx} className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sky-400 font-bold uppercase">{char?.name} • {seg.emotion}</span>
                      <span className="text-gray-500 font-mono">SEG_{idx+1}</span>
                    </div>
                    <p className="text-sm text-gray-400 italic font-light">"{seg.text}"</p>
                    <input 
                      type="range" min="1" max="10" value={seg.intensity} 
                      onChange={(e) => updateSegmentIntensity(idx, parseInt(e.target.value))}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TTSForm;
