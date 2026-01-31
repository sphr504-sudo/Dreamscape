
import React, { useState } from 'react';
import { Brain, Fingerprint, PlayCircle, Sliders, MessageSquareQuote, AlertCircle, Timer, AudioLines, Users } from 'lucide-react';
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
  const [localAnalysis, setLocalAnalysis] = useState<ScriptAnalysis | null>(null);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setProgress(0);
    setErrorMsg(null);
    setStatus('Detecting Emotional Arcs...');

    try {
      const analysis = await analyzeScript(text, (msg) => setStatus(msg));
      // Map suggested voices to assignedVoiceName
      analysis.characters = analysis.characters.map(c => ({
        ...c,
        assignedVoiceName: c.suggestedVoice as Voice || 'Kore'
      }));
      setLocalAnalysis(analysis);
      onAnalysisComplete(analysis);
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg("Failed to analyze script. Please try a shorter snippet.");
      setIsProcessing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!localAnalysis) return;
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing Neural Actors...');
    const parts: string[] = [];

    try {
      for (let i = 0; i < localAnalysis.segments.length; i++) {
        const seg = localAnalysis.segments[i];
        const char = localAnalysis.characters.find(c => c.id === seg.characterId)!;
        
        setStatus(`Performing: ${char.name}...`);
        const b64 = await synthesizeSegment(seg, char, (msg) => setStatus(msg));
        parts.push(b64);
        setProgress(Math.round(((i + 1) / localAnalysis.segments.length) * 100));
        
        // Pacing for free tier
        if (i < localAnalysis.segments.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      onAudioComplete(parts);
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg("Neural synthesis limit reached. Please wait a minute and try again.");
      setIsProcessing(false);
    }
  };

  const updateCharacterVoice = (charId: string, voice: Voice) => {
    if (!localAnalysis) return;
    const updated = {
      ...localAnalysis,
      characters: localAnalysis.characters.map(c => c.id === charId ? { ...c, assignedVoiceName: voice } : c)
    };
    setLocalAnalysis(updated);
    onAnalysisComplete(updated);
  };

  const updateSegmentIntensity = (index: number, intensity: number) => {
    if (!localAnalysis) return;
    const updatedSegments = [...localAnalysis.segments];
    updatedSegments[index] = { ...updatedSegments[index], intensity };
    setLocalAnalysis({ ...localAnalysis, segments: updatedSegments });
  };

  return (
    <div className="space-y-6 relative">
      {isProcessing && (
        <div className="absolute inset-0 z-[60] bg-[#070707]/95 backdrop-blur-2xl rounded-3xl flex flex-col items-center justify-center p-8 border border-white/10 animate-in fade-in">
          <div className="w-24 h-24 relative mb-6">
            <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
          <p className="text-indigo-400 text-[10px] font-mono uppercase tracking-[0.3em]">{status}</p>
          <div className="w-48 h-1 bg-white/5 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-400/80">{errorMsg}</p>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        <label className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
          <MessageSquareQuote className="w-4 h-4" /> Script Manuscript
        </label>
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
            onClick={handleSynthesize}
            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] animate-pulse-subtle"
          >
            <PlayCircle className="w-6 h-6" />
            <span className="text-lg uppercase tracking-widest">Render Neural Audio</span>
          </button>
        )}
      </div>

      {localAnalysis && !isProcessing && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <Users className="text-indigo-400 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Cast Voice Selection</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localAnalysis.characters.map(char => (
                <div key={char.id} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                  <h4 className="font-bold text-white text-sm">{char.name} ({char.ageGroup})</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {VOICES.map(v => (
                      <button
                        key={v}
                        onClick={() => updateCharacterVoice(char.id, v)}
                        className={`text-[8px] font-bold py-2 rounded border ${char.assignedVoiceName === v ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-transparent text-gray-500'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <Sliders className="text-sky-400 w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Emotional Tuning</h3>
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {localAnalysis.segments.map((seg, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-sky-400 font-bold uppercase">{seg.emotion} (Intensity {seg.intensity})</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" value={seg.intensity} 
                    onChange={(e) => updateSegmentIntensity(idx, parseInt(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TTSForm;
