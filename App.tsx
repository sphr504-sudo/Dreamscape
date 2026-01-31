
import React, { useState } from 'react';
import { Settings, Cloud, MessageSquare, Waves } from 'lucide-react';
import TTSForm from './components/TTSForm';
import DeploymentGuide from './components/DeploymentGuide';
import AudioPlayer from './components/AudioPlayer';
import TextAnalysisPanel from './components/TextAnalysisPanel';
import { ScriptAnalysis } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'deploy'>('studio');
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Waves className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight uppercase">Aether Voice</h1>
          </div>
          
          <nav className="flex items-center gap-6">
            <button onClick={() => setActiveTab('studio')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${activeTab === 'studio' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}>
              <MessageSquare className="w-4 h-4" /> Studio
            </button>
            <button onClick={() => setActiveTab('deploy')} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${activeTab === 'deploy' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}>
              <Cloud className="w-4 h-4" /> Deployment
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-indigo-400 flex items-center gap-2 font-bold uppercase tracking-widest">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              Ambient Engine Ready
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <TTSForm 
                onAnalysisComplete={setAnalysis} 
                setIsProcessing={setIsProcessing}
                isProcessing={isProcessing}
                onPerformRequest={() => setPlayTrigger(prev => prev + 1)}
              />
              <AudioPlayer analysis={analysis} triggerPlay={playTrigger} />
            </div>
            <div className="lg:col-span-5">
              <TextAnalysisPanel analysis={analysis} isProcessing={isProcessing} />
            </div>
          </div>
        )}

        {activeTab === 'deploy' && <DeploymentGuide />}
      </main>

      <footer className="border-t border-white/5 py-8 mt-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2024 Aether Voice. Local Voice Processing Engine.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
