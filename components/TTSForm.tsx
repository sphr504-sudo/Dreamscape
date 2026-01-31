
import React, { useState } from 'react';
import { Sparkles, Loader2, Music, UserCheck, Users, Info } from 'lucide-react';
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

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setProgress(5);
    setStatus('Decoding Script Hierarchy...');

    try {
      // 1. Structural Analysis
      const analysis = await analyzeScript(text);
      setRegistry(analysis.characters);
      onAnalysisComplete(analysis);
      setProgress(30);
      setStatus(`Detected ${analysis.characters.length} characters. Starting Synthesis...`);

      // 2. Sequential Synthesis
      const audioParts: string[] = [];
      for (let i = 0; i < analysis.segments.length; i++) {
        const seg = analysis.segments[i];
        const char = analysis.characters.find(c => c.id === seg.characterId) || analysis.characters[0];
        
        setStatus(`Synthesizing segment ${i+1}/${analysis.segments.length}: ${char.name}`);
        const base64 = await synthesizeSegment(seg, char);
        audioParts.push(base64);
        
        const currentProgress = 30 + ((i + 1) / analysis.segments.length) * 70;
        setProgress(Math.floor(currentProgress));
      }

      onAudioComplete(audioParts);
      setStatus('Complete');
      setTimeout(() => setProgress(0), 1000);

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
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Script Manuscript
          </label>
          <button onClick={setSample} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Load Multi-Character Sample
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Format: Character Name: Dialogue line..."
          className="w-full h-48 bg-black/40 border border-white/5 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder:text-gray-600"
        />

        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isProcessing || !text.trim()}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg group"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          <span>Generate Neural Performance</span>
        </button>
      </div>

      {registry.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-indigo-500 w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Character Voice Registry</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registry.map(char => (
              <div key={char.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{char.name}</h4>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase">{char.ageGroup} • {char.gender}</span>
                  </div>
                  <Info className="w-3 h-3 text-gray-600 cursor-help" title={char.traits} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {VOICES.map(v => (
                    <button
                      key={v}
                      onClick={() => updateCharacterVoice(char.id, v)}
                      className={`text-[10px] px-2 py-1 rounded transition-all ${char.baseVoice === v ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
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
