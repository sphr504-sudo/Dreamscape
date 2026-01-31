
import React, { useState } from 'react';
import { Settings, Play, Shield, Cpu, Cloud, Terminal, MessageSquare, Waves } from 'lucide-react';
import TTSForm from './components/TTSForm';
import DeploymentGuide from './components/DeploymentGuide';
import AudioPlayer from './components/AudioPlayer';
import TextAnalysisPanel from './components/TextAnalysisPanel';
import { StoryAnalysis } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'deploy' | 'arch'>('studio');
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Waves className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AETHER VOICE <span className="text-xs font-normal text-indigo-400 ml-1">v3.0.0</span></h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${activeTab === 'studio' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" /> Studio
            </button>
            <button 
              onClick={() => setActiveTab('deploy')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${activeTab === 'deploy' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Cloud className="w-4 h-4" /> Deployment Hub
            </button>
            <button 
              onClick={() => setActiveTab('arch')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${activeTab === 'arch' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
            >
              <Cpu className="w-4 h-4" /> Architecture
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Model Status</span>
              <span className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Gemini 2.5 Live
              </span>
            </div>
            <Settings className="text-gray-400 hover:text-white cursor-pointer w-5 h-5 transition-colors" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <TTSForm 
                onAnalysisComplete={setAnalysis} 
                onAudioComplete={setAudioBase64}
                setIsProcessing={setIsProcessing}
                isProcessing={isProcessing}
              />
              {audioBase64 && <AudioPlayer base64={audioBase64} />}
            </div>
            <div className="lg:col-span-5">
              <TextAnalysisPanel analysis={analysis} isProcessing={isProcessing} />
            </div>
          </div>
        )}

        {activeTab === 'deploy' && <DeploymentGuide />}

        {activeTab === 'arch' && (
          <div className="space-y-12 py-8">
            <section className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">TTS Neural Architecture</h2>
              <p className="text-gray-400">Deep dive into the requested Tacotron 2 + WaveNet synthesis pipeline for high-fidelity offline production.</p>
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <Terminal className="text-indigo-500 w-8 h-8" />
                  <h3 className="text-xl font-bold">Tacotron 2 Encoder</h3>
                </div>
                <p className="text-gray-300 mb-4">Sequence-to-sequence feature prediction model that maps text character embeddings to mel-spectrograms. Uses bidirectional LSTM and location-sensitive attention.</p>
                <div className="mono text-xs bg-black/40 p-4 rounded-lg text-indigo-300">
                  {`# Example PyTorch Implementation
class Tacotron2(nn.Module):
    def __init__(self, hparams):
        super(Tacotron2, self).__init__()
        self.embedding = nn.Embedding(n_symbols, embed_dim)
        self.encoder = Encoder(hparams)
        self.decoder = Decoder(hparams)`}
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <Play className="text-emerald-500 w-8 h-8" />
                  <h3 className="text-xl font-bold">WaveNet Vocoder</h3>
                </div>
                <p className="text-gray-300 mb-4">A dilated causal convolutional neural network that synthesizes raw audio waveforms from the mel-spectrogram input provided by Tacotron 2.</p>
                <div className="mono text-xs bg-black/40 p-4 rounded-lg text-emerald-300">
                  {`# WaveNet Dilation Logic
class WaveNet(nn.Module):
    def __init__(self, layers=24, res_channels=64):
        self.dilations = [2**i for i in range(10)] * 3
        self.blocks = nn.ModuleList([
            ResBlock(d) for d in self.dilations
        ])`}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2024 Aether Voice Labs. Built for next-gen accessibility.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Shield className="w-5 h-5" /></a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors"><Cpu className="w-5 h-5" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
