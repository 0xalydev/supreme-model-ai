import React, { useState, useRef, useEffect } from 'react';
import { AutonomousPhase, AutoSwitchEvent, AutonomousRelayState } from '../types';
import { AVAILABLE_MODELS, MODEL_MAP } from '../data/models';
import { ModelIcon } from './ModelIcon';
import { FormattedOutput } from './FormattedOutput';
import { planAutonomousRelayPhases } from '../services/promptAnalyzer';
import { orchestratorService, AutonomousRelayController } from '../services/llmService';
import { 
  Sparkles, 
  RotateCcw, 
  Activity, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Copy, 
  Check, 
  Cpu, 
  ShieldCheck,
  Radio,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const AUTO_RELAY_TEMPLATES = [
  {
    title: '4-Model Autonomous Relay (API + Math Proof + Pitch + TLDR)',
    badge: 'Claude → DeepSeek → GPT-4o → Flash',
    prompt: `1. Write a production-grade TypeScript API service for a distributed rate limiter using Redis and sliding-window counter.
2. Formally prove the time and space complexity of the sliding-window algorithm with mathematical derivation.
3. Draft an engaging, viral Twitter thread announcing this release to backend engineers.
4. Give a concise 3-bullet executive summary of the performance benchmarks.`
  },
  {
    title: 'Algorithmic Proof to Developer Copy',
    badge: 'Claude → DeepSeek → GPT-4o',
    prompt: `1. Implement an optimized quickselect algorithm in Python to find the k-th smallest element in O(n) average time.
2. Derive the recurrence relation T(n) = T(n/2) + O(n) mathematically using Master Theorem.
3. Write a developer-friendly blog introduction explaining why engineers should use this instead of full sorting.`
  },
  {
    title: 'Distributed System Spec to High-Speed Summary',
    badge: 'Claude → Gemini Flash',
    prompt: `1. Design an event-driven architecture using Apache Kafka and WebSocket pub/sub for real-time multiplayer gaming.
2. Provide a sub-second TL;DR of the architectural fault tolerance in 3 bullet points.`
  }
];

export const AutonomousRelayView: React.FC = () => {
  const [prompt, setPrompt] = useState(AUTO_RELAY_TEMPLATES[0].prompt);
  const [relayState, setRelayState] = useState<AutonomousRelayState>({
    isRunning: false,
    activeModelId: 'claude-3-5-sonnet',
    currentPhaseIndex: 0,
    phases: [],
    autoSwitches: [],
    streamedOutput: '',
    totalTokens: 0,
    startedAt: 0
  });

  const [copied, setCopied] = useState(false);
  const controllerRef = useRef<AutonomousRelayController | null>(null);
  const streamBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (relayState.isRunning) {
      streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [relayState.streamedOutput]);

  const handleStartAutonomousRelay = () => {
    if (!prompt.trim() || relayState.isRunning) return;

    const plannedPhases = planAutonomousRelayPhases(prompt);

    setRelayState({
      isRunning: true,
      activeModelId: plannedPhases[0]?.modelId || 'claude-3-5-sonnet',
      currentPhaseIndex: 0,
      phases: plannedPhases,
      autoSwitches: [],
      streamedOutput: '',
      totalTokens: 0,
      startedAt: Date.now()
    });

    const controller = orchestratorService.executeAutonomousRelayStream(
      plannedPhases,
      {
        onPhaseStart: (phase) => {
          setRelayState((prev) => ({
            ...prev,
            activeModelId: phase.modelId,
            currentPhaseIndex: phase.phaseIndex - 1,
            phases: prev.phases.map((p) =>
              p.id === phase.id ? { ...p, status: 'running' } : p
            )
          }));
        },
        onToken: (_chunk, fullText, activeModelId) => {
          setRelayState((prev) => ({
            ...prev,
            streamedOutput: fullText,
            activeModelId,
            totalTokens: fullText.split(/\s+/).length
          }));
        },
        onAutoSwitch: (event) => {
          setRelayState((prev) => ({
            ...prev,
            activeModelId: event.toModelId,
            autoSwitches: [...prev.autoSwitches, event]
          }));
        },
        onPhaseComplete: (completedPhase) => {
          setRelayState((prev) => ({
            ...prev,
            phases: prev.phases.map((p) =>
              p.id === completedPhase.id ? { ...p, status: 'completed' } : p
            )
          }));
        },
        onAllCompleted: (finalText) => {
          setRelayState((prev) => ({
            ...prev,
            isRunning: false,
            streamedOutput: finalText,
            completedAt: Date.now()
          }));
          controllerRef.current = null;
        },
        onError: (err) => {
          setRelayState((prev) => ({
            ...prev,
            isRunning: false,
            streamedOutput: prev.streamedOutput + `\n\n**Error during autonomous relay:** ${err}`
          }));
          controllerRef.current = null;
        }
      }
    );

    controllerRef.current = controller;
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
      controllerRef.current = null;
    }
    setRelayState((prev) => ({ ...prev, isRunning: false }));
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(relayState.streamedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentModel = MODEL_MAP[relayState.activeModelId] || MODEL_MAP['claude-3-5-sonnet'];

  return (
    <div className="max-w-[1180px] mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Hero Section matching revenue.family layout & typography */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6 pb-2">
        {/* Left Hero Copy */}
        <div className="lg:col-span-7 space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2.5 h-[34px] px-3.5 rounded-full bg-white/[0.06] border border-white/10 text-[13px] text-[#a3a8b0]">
            <span className="rf-dot-live" />
            <span>Autonomous Engine <strong className="text-white">ONLINE</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-[#e8ebef] font-mono">Zero manual clicks</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.05em] leading-[0.96] text-white">
            <span>Orchestrate AI models</span><br />
            <span className="rf-gr">dynamically in real time.</span><br />
            <span className="text-[#6c717a]">Auto-switch mid-stream.</span>
          </h1>

          {/* Lead */}
          <p className="text-[17px] sm:text-[18.5px] text-[#a3a8b0] max-w-[540px] leading-[1.45]">
            Enter any task or prompt. The system breaks it into specialized intents, highlights each part, and <strong className="text-white font-semibold">automatically switches the active model mid-generation</strong> as requirements shift.
          </p>

          {/* Micro trust indicators */}
          <div className="flex flex-wrap gap-5 text-[13px] text-[#6c717a] pt-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#e8ebef]" />
              <span>Auto-Pilot Enabled</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#e8ebef]" />
              <span>Full Context Handoff</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#e8ebef]" />
              <span>Multi-Model Ensemble</span>
            </span>
          </div>
        </div>

        {/* Right Floating Stage Card */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="rf-acard w-full max-w-[380px] p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
              <span>Active Authority</span>
              <span className="font-mono font-bold text-white">LIVE</span>
            </div>

            <div className="flex items-center gap-3 py-2">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-md border"
                style={{
                  backgroundColor: `${currentModel.accentColor}20`,
                  borderColor: `${currentModel.accentColor}50`,
                  color: currentModel.accentColor
                }}
              >
                <ModelIcon name={currentModel.avatarIcon} className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl font-bold font-mono text-white tracking-tight">{currentModel.name}</div>
                <div className="text-xs text-[#a3a8b0] line-clamp-1">{currentModel.tagline}</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs">
              <span className="text-[#a3a8b0]">Status:</span>
              <span className="font-mono font-bold text-[#e8ebef] text-xs">
                {relayState.isRunning ? 'Streaming Tokens...' : 'Ready for Relay'}
              </span>
            </div>
            <div className="text-[11px] text-[#6c717a] font-mono flex items-center justify-between">
              <span>Handoffs: {relayState.autoSwitches.length} auto-switches</span>
              <span className="text-emerald-400">Context Preserved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Input Box styled with revenue.family rf-glass */}
      <div className="rf-glass p-6 sm:p-8 max-w-[880px] mx-auto space-y-6">
        {/* Template selector pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
            <span className="font-bold uppercase tracking-wider">Multi-Intent Scenarios</span>
            <span>Click to load</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {AUTO_RELAY_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(tpl.prompt)}
                disabled={relayState.isRunning}
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition text-left group disabled:opacity-50"
              >
                <div className="text-xs font-bold text-white group-hover:text-[#e8ebef] transition line-clamp-1">
                  {tpl.title}
                </div>
                <div className="text-[10px] text-[#a3a8b0] font-mono mt-1">
                  {tpl.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
            <span className="font-bold uppercase tracking-wider">Your Task / Prompt</span>
            <span className="font-mono">Auto-detects intents & model switches</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-white/30 transition">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={relayState.isRunning}
              rows={4}
              placeholder="Type any task or prompt with multiple requirements..."
              className="w-full bg-transparent text-sm sm:text-[15px] font-sans text-[#eef0f2] placeholder:text-[#6c717a] focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="text-xs text-[#a3a8b0] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#e8ebef]" />
            <span>Context seamlessly transferred across models</span>
          </div>

          <div>
            {relayState.isRunning ? (
              <button
                onClick={handleCancel}
                className="rf-btn rf-btn-glassy text-xs font-bold text-red-300 border-red-500/30 hover:bg-red-500/10"
              >
                <span>Stop Generation</span>
              </button>
            ) : (
              <button
                onClick={handleStartAutonomousRelay}
                disabled={!prompt.trim()}
                className="rf-btn rf-btn-primary h-[48px] px-8 text-sm font-bold shadow-lg"
              >
                <span>Start Autonomous Model Relay</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Planned Step Chain Cards */}
      {relayState.phases.length > 0 && (
        <div className="rf-glass p-6 sm:p-8 max-w-[880px] mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Activity className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Live Autonomous Model Sequence</span>
                  <span className="text-[11px] font-mono text-[#a3a8b0]">
                    ({relayState.autoSwitches.length} Auto-Switches)
                  </span>
                </h3>
                <p className="text-xs text-[#a3a8b0]">
                  Real-time pipeline tracking showing how models hand off execution to one another
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a3a8b0]">Active:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                {currentModel.name}
              </span>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {relayState.phases.map((phase, idx) => {
              const model = MODEL_MAP[phase.modelId] || MODEL_MAP['gpt-4o'];
              const isActive = relayState.isRunning && relayState.currentPhaseIndex === idx;
              const isDone = phase.status === 'completed';

              return (
                <div
                  key={phase.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'border-white/40 bg-white/10 shadow-lg shadow-white/5'
                      : isDone
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-white/10 bg-black/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                      STEP {idx + 1}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] font-mono text-amber-300 animate-pulse">
                        Generating
                      </span>
                    ) : isDone ? (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#6c717a]">
                        Queued
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-white truncate mb-1">
                    {model.name}
                  </div>
                  <div className="text-[11px] text-[#a3a8b0] line-clamp-1 mb-1">
                    {phase.phaseTitle}
                  </div>
                  <div className="text-[10px] text-[#6c717a] line-clamp-2 italic">
                    {phase.reason}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-Switch Log */}
          {relayState.autoSwitches.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono">
              <span className="text-[11px] font-bold text-[#a3a8b0] uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-white" />
                Live Auto-Switch Transition Log:
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {relayState.autoSwitches.map((sw, i) => {
                  const fromM = MODEL_MAP[sw.fromModelId];
                  const toM = MODEL_MAP[sw.toModelId];
                  return (
                    <div key={i} className="text-xs text-white/90 flex items-center gap-2">
                      <span className="text-[#6c717a]">Switch {i + 1}:</span>
                      <strong className="text-white">{fromM?.name}</strong>
                      <ChevronRight className="w-3 h-3 text-[#6c717a]" />
                      <strong className="text-amber-300">{toM?.name}</strong>
                      <span className="text-[#a3a8b0] truncate">({sw.reason})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Streaming Terminal Output */}
      {relayState.streamedOutput && (
        <div className="rf-glass p-6 sm:p-8 max-w-[880px] mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Unified Autonomous Generation Stream</h3>
                <p className="text-xs text-[#a3a8b0]">
                  Real-time tokens streamed across multiple specialized LLMs with dynamic handoffs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#a3a8b0] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                {relayState.totalTokens} tokens
              </span>

              <button
                onClick={handleCopyOutput}
                className="rf-btn rf-btn-glassy h-8 px-3 text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Formatted Output Area */}
          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 min-h-[300px]">
            <FormattedOutput
              content={relayState.streamedOutput}
              isStreaming={relayState.isRunning}
            />
            <div ref={streamBottomRef} />
          </div>
        </div>
      )}
    </div>
  );
};
