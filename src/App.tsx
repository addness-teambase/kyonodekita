import React from 'react';
import { Smile, Brain } from 'lucide-react';
import { StressProvider, useStress } from './context/StressContext';
import ObservationButton from './components/StressButton';
import StressGraph from './components/StressGraph';
import StressHistory from './components/StressHistory';

function AppContent() {
  const { recordMode, setRecordMode } = useStress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-300">
      <div className="container mx-auto max-w-md px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            きょうのできた
          </h1>
          <h2 className="text-lg font-medium text-white/90 mb-1">
            {recordMode === 'good' ? '良かったこと' : '不安に思ったこと'}
          </h2>
          <p className="text-sm text-white/90">
            {recordMode === 'good'
              ? '自分や周りに対して「いいな」と感じたことを記録'
              : '不安や悩み、心配事などを記録'
            }
          </p>
        </header>

        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setRecordMode('stress')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all ${recordMode === 'stress'
              ? 'bg-white text-blue-400'
              : 'bg-blue-300/30 text-white hover:bg-blue-300/40'
              }`}
          >
            <Brain size={18} />
            <span>不安なこと</span>
          </button>
          <button
            onClick={() => setRecordMode('good')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all ${recordMode === 'good'
              ? 'bg-white text-blue-400'
              : 'bg-blue-300/30 text-white hover:bg-blue-300/40'
              }`}
          >
            <Smile size={18} />
            <span>良かったこと</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center mb-8">
            <ObservationButton />
          </div>
          <StressGraph mode={recordMode} />
          <StressHistory mode={recordMode} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <StressProvider>
      <AppContent />
    </StressProvider>
  );
}

export default App;