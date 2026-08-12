import React, { useState } from 'react';
import { PromptSegment, SegmentExecution } from '../types';
import { AVAILABLE_MODELS, MODEL_MAP } from '../data/models';
import { ModelIcon } from './ModelIcon';
import { FormattedOutput } from './FormattedOutput';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Activity, 
  ChevronDown, 
  Clock 
} from 'lucide-react';

interface ExecutionPipelineProps {
  segments: PromptSegment[];
  executions: Record<string, SegmentExecution>;
  synthesizedOutput: string;
  isExecuting: boolean;
  onSwitchSegmentModel: (segmentId: string, newModelId: string) => void;
  onRerunSegment: (segmentId: string) => void;
}

export const ExecutionPipeline: React.FC<ExecutionPipelineProps> = ({
  segments,
  executions,
  synthesizedOutput,
  isExecuting,
  onSwitchSegmentModel,
  onRerunSegment
}) => {
  const [activeSwitcherSegmentId, setActiveSwitcherSegmentId] = useState<string | null>(null);
  const [copiedMaster, setCopiedMaster] = useState(false);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'synthesis'>('pipeline');

  const handleCopyMaster = () => {
    navigator.clipboard.writeText(synthesizedOutput);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2000);
  };

  const completedCount = Object.values(executions).filter(e => e.status === 'completed' || e.status === 'switched').length;
  const totalCount = segments.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Pipeline Status Bar */}
      <div className="rf-glass p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Multi-Model Live Execution Pipeline</span>
              {isExecuting && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                  <Activity className="w-3 h-3 text-amber-400 animate-spin" />
                  Streaming in Parallel
                </span>
              )}
              {!isExecuting && completedCount === totalCount && totalCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  All Models Completed
                </span>
              )}
            </div>
            <div className="text-xs text-[#a3a8b0] mt-0.5">
              Each segment runs under its dedicated specialized LLM authority with full mid-stream handoff capability.
            </div>
          </div>
        </div>

        {/* View Switcher Tabs & Progress */}
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-mono text-[#a3a8b0]">{completedCount}/{totalCount} Completed ({progressPercent}%)</span>
            <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center p-1 rounded-full bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition ${
                activeTab === 'pipeline'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-[#a3a8b0] hover:text-white'
              }`}
            >
              Model Streams
            </button>
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'synthesis'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-[#a3a8b0] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Unified Synthesis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pipeline' ? (
        <div className="space-y-4">
          {segments.map((segment, index) => {
            const exec = executions[segment.id];
            const currentModelId = exec?.modelId || segment.assignedModelId;
            const model = MODEL_MAP[currentModelId] || MODEL_MAP['gpt-4o'];
            const isSwitching = activeSwitcherSegmentId === segment.id;
            const isRunning = exec?.status === 'running';
            const hasHandoff = exec?.handoffs && exec.handoffs.length > 0;

            return (
              <div
                key={segment.id}
                className="rounded-2xl border bg-black/40 border-white/10 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200"
                style={{
                  boxShadow: isRunning ? `0 0 25px -5px ${model.accentColor}25` : undefined
                }}
              >
                {/* Model Stream Header */}
                <div 
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/10"
                  style={{
                    backgroundColor: `${model.accentColor}0a`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
                      style={{
                        backgroundColor: `${model.accentColor}25`,
                        borderColor: `${model.accentColor}60`,
                        color: model.accentColor
                      }}
                    >
                      <ModelIcon name={model.avatarIcon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{model.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-[#a3a8b0]">
                          Part {index + 1}: {segment.categoryLabel}
                        </span>
                        {hasHandoff && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                            Switched Mid-Stream
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#a3a8b0]">
                        {model.tagline}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center gap-2.5">
                    {/* Latency badge */}
                    {exec?.latencyMs ? (
                      <span className="text-[11px] font-mono text-[#a3a8b0] flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                        <Clock className="w-3 h-3 text-[#6c717a]" />
                        {(exec.latencyMs / 1000).toFixed(2)}s
                      </span>
                    ) : null}

                    {/* DYNAMIC MID-STREAM MODEL SWITCH BUTTON */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveSwitcherSegmentId(isSwitching ? null : segment.id)}
                        className="rf-btn rf-btn-glassy h-8 px-3 text-xs font-semibold text-white"
                        title="Change model mid-stream! The new model takes over immediately with context intact."
                      >
                        <ArrowRightLeft className="w-3 h-3 text-amber-300 animate-pulse mr-1" />
                        <span>Switch Model Mid-Stream</span>
                        <ChevronDown className="w-3 h-3 opacity-70 ml-1" />
                      </button>

                      {/* Dropdown for Mid-Stream Switch */}
                      {isSwitching && (
                        <div 
                          className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#131417] border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-white/10">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                              <span>Switch Model Right Now</span>
                            </div>
                            <span className="text-[10px] text-[#6c717a] font-mono">Preserves Context</span>
                          </div>
                          <div className="text-[11px] text-[#a3a8b0] px-2 mb-2">
                            Select a new LLM to take over generation immediately:
                          </div>

                          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                            {AVAILABLE_MODELS.map((targetModel) => {
                              const isCurrent = targetModel.id === currentModelId;
                              return (
                                <button
                                  key={targetModel.id}
                                  onClick={() => {
                                    onSwitchSegmentModel(segment.id, targetModel.id);
                                    setActiveSwitcherSegmentId(null);
                                  }}
                                  disabled={isCurrent}
                                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition text-xs ${
                                    isCurrent
                                      ? 'opacity-40 cursor-not-allowed bg-white/5 text-[#6c717a]'
                                      : 'hover:bg-white/10 text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div 
                                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                      style={{ backgroundColor: `${targetModel.accentColor}20`, color: targetModel.accentColor }}
                                    >
                                      <ModelIcon name={targetModel.avatarIcon} className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">{targetModel.name}</div>
                                      <div className="text-[10px] text-[#6c717a] line-clamp-1">{targetModel.tagline}</div>
                                    </div>
                                  </div>
                                  {isCurrent && <span className="text-[10px] text-[#6c717a] font-mono">Current</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Re-run button */}
                    <button
                      onClick={() => onRerunSegment(segment.id)}
                      disabled={isRunning}
                      className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[#a3a8b0] hover:text-white transition disabled:opacity-40"
                      title="Re-run this subtask"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtask Prompt Context Snippet */}
                <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs text-[#a3a8b0]">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-semibold text-[#6c717a]">Subtask:</span>
                    <span className="truncate italic text-white/90">"{segment.text}"</span>
                  </div>
                </div>

                {/* Output Stream Body */}
                <div className="p-4 sm:p-5 bg-black/50 min-h-[140px] text-sm">
                  {exec?.output ? (
                    <FormattedOutput content={exec.output} isStreaming={isRunning} />
                  ) : isRunning ? (
                    <div className="flex items-center gap-3 py-6 justify-center text-[#a3a8b0] text-xs">
                      <Activity className="w-4 h-4 text-white animate-spin" />
                      <span>{model.name} is streaming tokens in real time...</span>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#6c717a] italic">
                      Waiting to execute...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Unified Synthesis Tab */
        <div className="rf-glass p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cohesive Multi-Model Synthesis</h3>
                <p className="text-xs text-[#a3a8b0]">
                  All specialized model outputs merged into an executive-ready composite response.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyMaster}
              className="rf-btn rf-btn-glassy h-8 px-3 text-xs"
            >
              {copiedMaster ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  <span className="text-emerald-400">Copied Full Synthesis</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>Copy Synthesis</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-black/50 rounded-2xl p-5 border border-white/10">
            <FormattedOutput content={synthesizedOutput} />
          </div>
        </div>
      )}
    </div>
  );
};
