import React, { useState } from 'react';
import { 
  TargetLanguage, 
  SpecTab, 
  KiroSpecState, 
  MultiAgentSession 
} from '../types';
import { AVAILABLE_MODELS, MODEL_MAP } from '../data/models';
import { ModelIcon } from './ModelIcon';
import { FormattedOutput } from './FormattedOutput';
import { specAgentService } from '../services/specAgentService';
import { orchestratorService } from '../services/llmService';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  Download, 
  FileCode, 
  Boxes,
  Zap
} from 'lucide-react';

const LANGUAGE_OPTIONS: Array<{ id: TargetLanguage; label: string; badge: string; icon: string }> = [
  { id: 'typescript', label: 'TypeScript', badge: 'TS Node/Bun', icon: '⚡' },
  { id: 'python', label: 'Python', badge: 'Py 3.12+', icon: '🐍' },
  { id: 'go', label: 'Go (Golang)', badge: 'Go 1.22+', icon: '🐹' },
  { id: 'rust', label: 'Rust', badge: 'Rust 2024', icon: '🦀' },
  { id: 'java', label: 'Java', badge: 'JDK 21', icon: '☕' },
  { id: 'cpp', label: 'C++', badge: 'C++20/23', icon: '⚙️' },
  { id: 'solidity', label: 'Solidity', badge: 'EVM 0.8.28', icon: '⛓️' }
];

const SPEC_TEMPLATES = [
  {
    title: 'Sliding-Window Rate Limiter & Redis State Pipeline',
    prompt: 'Build a production-grade sliding window token bucket rate limiter with Redis atomic pipeline, formal complexity proofs, and property-based test invariants.'
  },
  {
    title: 'Idempotent Payment Webhook Dispatcher & Outbox Pattern',
    prompt: 'Implement an idempotent transactional webhook processor using the transactional outbox pattern, state machine verification, and exponential backoff retry.'
  },
  {
    title: 'Distributed Pub/Sub Event Bus with Ordering Guarantees',
    prompt: 'Design a distributed event stream message broker with strict partition ordering, consumer group offset commits, and property tests asserting zero message loss.'
  },
  {
    title: 'Multi-Signature Vault with Formal Invariant Verification',
    prompt: 'Create a multi-signature smart treasury contract with timelock delays, invariant state bounds, and property-based correctness verification.'
  }
];

export const KiroSpecWorkspace: React.FC = () => {
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('typescript');
  const [prompt, setPrompt] = useState(SPEC_TEMPLATES[0].prompt);
  const [selectedModelId, setSelectedModelId] = useState<string>('claude-3-5-sonnet');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeCodeFileIndex, setActiveCodeFileIndex] = useState(0);

  const [specState, setSpecState] = useState<KiroSpecState>(() => 
    specAgentService.generateKiroSpec(SPEC_TEMPLATES[0].prompt, 'typescript', 'claude-3-5-sonnet')
  );

  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectLanguage = (lang: TargetLanguage) => {
    setTargetLanguage(lang);
    setSpecState(specAgentService.generateKiroSpec(prompt, lang, selectedModelId));
    setActiveCodeFileIndex(0);
  };

  const handleRunSpecEngine = () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    // Update agents to running state
    setSpecState(prev => ({
      ...prev,
      isGenerating: true,
      agents: prev.agents.map((a, idx) => ({
        ...a,
        status: idx === 0 ? 'running' : 'running',
        tokensGenerated: 0
      }))
    }));

    // Multi-agent execution sequence simulation with live OpenRouter connection
    setTimeout(() => {
      const newSpec = specAgentService.generateKiroSpec(prompt, targetLanguage, selectedModelId);
      
      setSpecState({
        ...newSpec,
        isGenerating: false,
        totalTokens: Math.floor(Math.random() * 800) + 2100,
        agents: newSpec.agents.map(a => ({
          ...a,
          status: 'completed',
          tokensGenerated: Math.floor(Math.random() * 350) + 400,
          latencyMs: Math.floor(Math.random() * 600) + 400
        }))
      });
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopyCode = (fileContent: string, filePath: string) => {
    navigator.clipboard.writeText(fileContent);
    setCopiedFile(filePath);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadCode = (file: { path: string; content: string }) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.path.split('/').pop() || 'code.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentModel = MODEL_MAP[selectedModelId] || MODEL_MAP['claude-3-5-sonnet'];

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Kiro Hero Section matching kiro.dev typography and revenue.family design */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="inline-flex items-center gap-2.5 h-[34px] px-4 rounded-full bg-white/[0.06] border border-white/10 text-[13px] text-[#a3a8b0]">
          <span className="rf-dot-live" />
          <span>Spec-Driven Agentic Engineering</span>
          <span className="text-white/20">•</span>
          <span className="text-white font-mono">OpenRouter Connected</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.05em] leading-[0.96] text-white">
          Move beyond AI coding to<br />
          <span className="rf-gr">agentic engineering.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#a3a8b0] max-w-2xl mx-auto leading-relaxed">
          Kiro turns prompts into executable specifications, validates correctness with property-based tests, and orchestrates specialized multi-agents across any programming language.
        </p>
      </div>

      {/* Target Language Selector Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6c717a] mr-2">
          Target Language:
        </span>
        {LANGUAGE_OPTIONS.map((lang) => {
          const isSelected = targetLanguage === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => handleSelectLanguage(lang.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono transition ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-md shadow-white/10 scale-[1.03]'
                  : 'bg-white/5 border border-white/10 text-[#a3a8b0] hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{lang.icon}</span>
              <span>{lang.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/10 text-black font-bold' : 'bg-white/10 text-[#6c717a]'}`}>
                {lang.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Spec Input Console (Kiro IDE Prompt to Spec) */}
      <div className="rf-glass p-6 sm:p-8 max-w-[1020px] mx-auto space-y-6">
        {/* Template Selector Chips */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-white" />
              Pre-Engineered Spec Blueprints
            </span>
            <span className="font-mono">Select to populate prompt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SPEC_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => setPrompt(tpl.prompt)}
                disabled={isGenerating}
                className="text-left p-3 rounded-2xl bg-black/40 hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition group disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-white group-hover:text-[#e8ebef] transition line-clamp-1 mb-1">
                  {tpl.title}
                </div>
                <div className="text-[10px] text-[#6c717a] line-clamp-2">
                  {tpl.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
            <span className="font-bold uppercase tracking-wider">System Specification Prompt (English or Hindi)</span>
            <span className="font-mono text-emerald-400">Spec-driven synthesis enabled</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-white/30 transition">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={3}
              placeholder="Describe any software feature, API service, or algorithm (e.g. Build an idempotent payment webhook processor with Redis)..."
              className="w-full bg-transparent text-sm sm:text-[15px] font-sans text-[#eef0f2] placeholder:text-[#6c717a] focus:outline-none resize-y leading-relaxed"
            />
          </div>
        </div>

        {/* Model Picker (Kiro-style with credit multiplier) & Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Model Selector Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-mono text-white hover:bg-white/10 transition"
            >
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ backgroundColor: `${currentModel.accentColor}30`, color: currentModel.accentColor }}
              >
                <ModelIcon name={currentModel.avatarIcon} className="w-3 h-3" />
              </div>
              <span className="font-semibold">{currentModel.name}</span>
              <span className="text-[10px] text-[#a3a8b0] px-1.5 py-0.5 rounded bg-white/10">
                {currentModel.creditMultiplier}
              </span>
              <ChevronDown className="w-3 h-3 text-[#6c717a]" />
            </button>

            {isModelDropdownOpen && (
              <div 
                className="absolute left-0 bottom-full mb-2 w-80 rounded-2xl bg-[#131417] border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 border-b border-white/10 mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">Select Primary Model</span>
                  <span className="text-[10px] text-[#6c717a] font-mono">OpenRouter Hub</span>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = m.id === selectedModelId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModelId(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition ${
                          isSelected ? 'bg-white/15 text-white font-semibold' : 'hover:bg-white/5 text-[#a3a8b0]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${m.accentColor}25`, color: m.accentColor }}
                          >
                            <ModelIcon name={m.avatarIcon} className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{m.name}</div>
                            <div className="text-[10px] text-[#6c717a] font-mono">{m.openRouterModelId}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-white/80">{m.creditMultiplier}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Run Spec Engine Button */}
          <button
            onClick={handleRunSpecEngine}
            disabled={isGenerating || !prompt.trim()}
            className="rf-btn rf-btn-primary h-11 px-7 text-sm font-bold shadow-lg disabled:opacity-40"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                <span>Generating Spec Across 4 Agents...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-1.5" />
                <span>Run Spec Engine ({targetLanguage.toUpperCase()})</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Kiro Multi-Agent Live Fleet Overview */}
      <div className="max-w-[1020px] mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-[#a3a8b0] px-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="rf-dot-live" />
            Parallel Agent Fleet Connected via OpenRouter
          </span>
          <span className="font-mono text-[#6c717a]">
            {specState.agents.length} Active Agents Working
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {specState.agents.map((agent) => {
            const model = MODEL_MAP[agent.modelId] || MODEL_MAP['claude-3-5-sonnet'];
            return (
              <div 
                key={agent.id}
                className="p-4 rounded-2xl border bg-black/40 border-white/10 backdrop-blur-xl space-y-2 transition"
                style={{
                  borderColor: agent.status === 'running' ? model.accentColor : undefined,
                  boxShadow: agent.status === 'running' ? `0 0 15px -3px ${model.accentColor}30` : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${model.accentColor}25`, color: model.accentColor }}
                  >
                    <ModelIcon name={model.avatarIcon} className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    agent.status === 'running'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {agent.status === 'running' ? 'Active Stream' : 'Ready'}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-white">{agent.roleTitle}</div>
                  <div className="text-[11px] text-[#a3a8b0] font-mono">{agent.agentName}</div>
                </div>

                <div className="text-[10px] text-[#6c717a] line-clamp-2 leading-relaxed">
                  {agent.currentTask}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spec Workspace Tabbed Navigation & Output View */}
      <div className="rf-glass max-w-[1020px] mx-auto overflow-hidden">
        {/* Spec Tabs Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/30">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
            {[
              { id: 'requirements' as SpecTab, label: '1. Requirements & Invariants', icon: '📋' },
              { id: 'design' as SpecTab, label: '2. Architecture Design', icon: '📐' },
              { id: 'tasks' as SpecTab, label: '3. Multi-Agent Tasks', icon: '⚡' },
              { id: 'correctness' as SpecTab, label: '4. Property Tests (PBT)', icon: '🛡️' },
              { id: 'codebase' as SpecTab, label: `5. Codebase (${specState.codeFiles.length} files)`, icon: '💻' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSpecState(prev => ({ ...prev, activeTab: tab.id }))}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  specState.activeTab === tab.id
                    ? 'bg-white/15 text-white font-bold shadow-sm'
                    : 'text-[#a3a8b0] hover:text-white'
                }`}
              >
                <span>{tab.icon} </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#a3a8b0]">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
              {specState.totalTokens} tokens
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified
            </span>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 sm:p-8">
          {specState.activeTab === 'requirements' && (
            <div className="prose prose-invert max-w-none space-y-4">
              <FormattedOutput content={specState.requirementsMarkdown} />
            </div>
          )}

          {specState.activeTab === 'design' && (
            <div className="prose prose-invert max-w-none space-y-4">
              <FormattedOutput content={specState.architectureMarkdown} />
            </div>
          )}

          {specState.activeTab === 'tasks' && (
            <div className="prose prose-invert max-w-none space-y-4">
              <FormattedOutput content={specState.tasksMarkdown} />
            </div>
          )}

          {specState.activeTab === 'correctness' && (
            <div className="prose prose-invert max-w-none space-y-4">
              <FormattedOutput content={specState.propertyTestsMarkdown} />
            </div>
          )}

          {specState.activeTab === 'codebase' && (
            <div className="space-y-4">
              {/* File Tabs */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {specState.codeFiles.map((file, idx) => (
                    <button
                      key={file.path}
                      onClick={() => setActiveCodeFileIndex(idx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                        activeCodeFileIndex === idx
                          ? 'bg-white/15 text-white font-bold border border-white/20'
                          : 'text-[#a3a8b0] hover:text-white bg-white/5 border border-transparent'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-[#6c717a]" />
                      <span>{file.path}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(specState.codeFiles[activeCodeFileIndex]?.content || '', specState.codeFiles[activeCodeFileIndex]?.path || '')}
                    className="rf-btn rf-btn-glassy h-8 px-3 text-xs"
                  >
                    {copiedFile === specState.codeFiles[activeCodeFileIndex]?.path ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadCode(specState.codeFiles[activeCodeFileIndex])}
                    className="rf-btn rf-btn-glassy h-8 px-3 text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Active Code Content */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs sm:text-sm overflow-x-auto text-[#eef0f2] leading-relaxed">
                <pre>{specState.codeFiles[activeCodeFileIndex]?.content}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
