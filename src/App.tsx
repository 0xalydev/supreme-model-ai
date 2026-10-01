import React, { useState } from 'react';
import { Header } from './components/Header';
import { KiroSpecWorkspace } from './components/KiroSpecWorkspace';
import { AutonomousRelayView } from './components/AutonomousRelayView';
import { InteractiveHandoffView } from './components/InteractiveHandoffView';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';

import { AppSettings } from './types';
import { orchestratorService } from './services/llmService';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'kiro_spec' | 'auto_relay' | 'interactive'>('kiro_spec');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => orchestratorService.getSettings());

  const handleModeChange = (mode: 'kiro_spec' | 'auto_relay' | 'interactive') => {
    setActiveMode(mode);
  };

  const handleSaveSettings = (updated: Partial<AppSettings>) => {
    orchestratorService.updateSettings(updated);
    setSettings(orchestratorService.getSettings());
  };

  return (
    <div className="min-h-screen text-[#eef0f2] flex flex-col font-sans antialiased selection:bg-white/20 selection:text-white relative">
      {/* Two-tone graphite backdrop with radial dots & floating orbs from revenue.family */}
      <div className="rf-bg" aria-hidden="true">
        <div className="dots" />
        <div className="orb o1" />
        <div className="orb o2" />
      </div>

      {/* Floating Pill Header */}
      <Header
        settings={settings}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 py-8 space-y-12 relative z-10">
        {/* Kiro.dev Spec-Driven Multi-Agent IDE (Primary Mode) */}
        {activeMode === 'kiro_spec' && (
          <KiroSpecWorkspace />
        )}

        {/* Autonomous Relay Mode (Mid-stream handoffs) */}
        {activeMode === 'auto_relay' && (
          <AutonomousRelayView />
        )}

        {/* Interactive Chat Mode */}
        {activeMode === 'interactive' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2 pt-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.05em] text-white">
                Interactive <span className="rf-gr">Multi-Agent Handoff</span> Chat
              </h2>
              <p className="text-sm text-[#a3a8b0]">
                Chat naturally with agents connected through OpenRouter. Switch model mid-generation to hand off execution without losing context.
              </p>
            </div>

            <InteractiveHandoffView />
          </div>
        )}
      </main>

      {/* OpenRouter & Multi-Agent Credentials Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Footer matching revenue.family design tokens */}
      <footer className="border-t border-white/10 py-10 px-6 text-[#6c717a] text-xs relative z-10 mt-16">
        <div className="max-w-[1180px] mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-[#a3a8b0]">
              <span className="font-extrabold text-white text-sm">Kiro Studio</span>
              <span>·</span>
              <span>Spec-Driven Agentic Engineering Hub</span>
            </div>
            <p className="text-[11px] text-[#6c717a]">
              Transforms prompts into executable specifications, asserts correctness through property-based tests, and coordinates multi-language systems with OpenRouter.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#a3a8b0]">
            <span className="flex items-center gap-1.5">
              <span className="rf-dot-live" />
              <span>OpenRouter Fleet Online</span>
            </span>
            <span>·</span>
            <span>TypeScript · Python · Go · Rust · Java · C++ · Solidity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
