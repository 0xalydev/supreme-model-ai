import React, { useState } from 'react';
import { PromptSegment } from '../types';
import { AVAILABLE_MODELS, MODEL_MAP } from '../data/models';
import { ModelIcon } from './ModelIcon';
import { Sparkles, Edit3, Check, ChevronDown, Cpu, ArrowRight } from 'lucide-react';

interface HighlightedPromptViewerProps {
  segments: PromptSegment[];
  onUpdateSegmentModel: (segmentId: string, newModelId: string) => void;
  onEditPrompt: () => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export const HighlightedPromptViewer: React.FC<HighlightedPromptViewerProps> = ({
  segments,
  onUpdateSegmentModel,
  onEditPrompt,
  onExecute,
  isExecuting
}) => {
  const [activeDropdownSegmentId, setActiveDropdownSegmentId] = useState<string | null>(null);

  if (segments.length === 0) return null;

  return (
    <div className="rf-glass p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Dynamic Prompt Deconstruction & Model Mapping</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                {segments.length} {segments.length === 1 ? 'Intent' : 'Specialized Intents Detected'}
              </span>
            </h3>
            <p className="text-xs text-[#a3a8b0]">
              Each section is analyzed, color-coded, and assigned to its optimal model. Click any model pill to re-route.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onEditPrompt}
            disabled={isExecuting}
            className="rf-btn rf-btn-glassy h-9 px-3.5 text-xs font-semibold disabled:opacity-50"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1 text-[#a3a8b0]" />
            <span>Edit Prompt</span>
          </button>

          <button
            onClick={onExecute}
            disabled={isExecuting}
            className="rf-btn rf-btn-primary h-9 px-4 text-xs font-bold shadow-md disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 mr-1" />
            <span>{isExecuting ? 'Orchestrating...' : 'Execute Multi-Model Pipeline'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Visual Prompt Highlight Segments */}
      <div className="space-y-3.5">
        {segments.map((segment, index) => {
          const model = MODEL_MAP[segment.assignedModelId] || MODEL_MAP['gpt-4o'];
          const isDropdownOpen = activeDropdownSegmentId === segment.id;

          return (
            <div
              key={segment.id}
              className="relative group transition-all duration-200 rounded-2xl border p-4 sm:p-5 bg-black/40 border-white/10 hover:border-white/20"
              style={{
                boxShadow: `0 4px 24px -4px ${model.accentColor}15`
              }}
            >
              {/* Segment top bar: Model pill & confidence */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                    PART {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {segment.categoryLabel}
                  </span>
                </div>

                {/* Model Selector Dropdown Pill */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdownSegmentId(isDropdownOpen ? null : segment.id)}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border transition hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: `${model.accentColor}18`,
                      borderColor: `${model.accentColor}50`,
                      color: model.accentColor
                    }}
                  >
                    <ModelIcon name={model.avatarIcon} className="w-3.5 h-3.5" />
                    <span>{model.name}</span>
                    <span className="text-[10px] opacity-75 font-mono">({Math.round(segment.confidence * 100)}% match)</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#131417] border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-[11px] font-bold text-[#a3a8b0] uppercase tracking-wider px-2.5 py-1.5 mb-1 border-b border-white/10">
                        Re-route subtask to model:
                      </div>
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                        {AVAILABLE_MODELS.map((m) => {
                          const isSelected = m.id === segment.assignedModelId;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                onUpdateSegmentModel(segment.id, m.id);
                                setActiveDropdownSegmentId(null);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition text-xs ${
                                isSelected 
                                  ? 'bg-white/10 text-white border border-white/20' 
                                  : 'hover:bg-white/5 text-[#a3a8b0] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div 
                                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${m.accentColor}20`, color: m.accentColor }}
                                >
                                  <ModelIcon name={m.avatarIcon} className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{m.name}</div>
                                  <div className="text-[10px] text-[#6c717a] font-mono line-clamp-1">{m.providerLabel} • {m.contextWindow}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Segment Prompt Content */}
              <div 
                className="p-3.5 rounded-xl text-sm text-[#eef0f2] leading-relaxed font-sans border-l-2 bg-black/30"
                style={{
                  borderLeftColor: model.accentColor
                }}
              >
                {segment.text}
              </div>

              {/* Routing justification reasoning */}
              <div className="mt-2.5 flex items-center gap-2 text-xs text-[#a3a8b0]">
                <span className="text-[#6c717a] font-medium">Routing Justification:</span>
                <span className="italic">{segment.reasoning}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
