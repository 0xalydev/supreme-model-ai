import React from 'react';
import { Sparkles, ArrowRight, Wand2, RefreshCw } from 'lucide-react';
import { AVAILABLE_MODELS } from '../data/models';
import { ModelIcon } from './ModelIcon';

interface PromptInputProps {
  prompt: string;
  onChange: (value: string) => void;
  onAnalyze: (rawPrompt: string) => void;
  isAnalyzing: boolean;
  isExecuting: boolean;
}

const TEMPLATE_PROMPTS = [
  {
    title: 'Full-Stack Feature + Math Proof + Marketing Copy',
    badge: 'Claude → DeepSeek → GPT-4o',
    text: `1. Write a production-ready TypeScript backend API handler for user authentication with JWT, bcrypt hashing, and rate limiting.
2. Formally prove the algorithmic time and space complexity of the token bucket rate limiter with mathematical derivation.
3. Draft an engaging, viral Twitter thread announcing this ultra-secure authentication launch to developer audiences.
4. Give a 3-bullet executive summary of the security guarantees.`
  },
  {
    title: 'Algorithm Benchmarking + Formal Logic + Quick TLDR',
    badge: 'Claude → DeepSeek → Flash',
    text: `1. Implement an optimized quickselect algorithm in Python to find the k-th smallest element in linear time O(n).
2. Calculate the worst-case vs average-case recurrence relation mathematically using Master Theorem and expectation proofs.
3. Provide a quick 3-sentence summary of when to prefer quickselect over standard heap-based selection.`
  },
  {
    title: 'Distributed System Architecture + High-Converting Pitch',
    badge: 'Claude → GPT-4o',
    text: `1. Design a resilient distributed pub/sub event architecture using Kafka, Redis caching, and WebSocket client connections.
2. Write a captivating, benefit-driven product landing page hero section that explains why this architecture never drops a message.`
  }
];

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  onChange,
  onAnalyze,
  isAnalyzing,
  isExecuting
}) => {
  const handleApplyTemplate = (tplText: string) => {
    onChange(tplText);
  };

  return (
    <div className="rf-glass p-6 sm:p-8 space-y-6">
      {/* Top Template Selector Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-white" />
            Quick Test Multi-Intent Templates:
          </span>
          <span className="font-mono">Click to load</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATE_PROMPTS.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleApplyTemplate(tpl.text)}
              disabled={isExecuting}
              className="text-left p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.06] border border-white/10 hover:border-white/20 transition group disabled:opacity-50"
            >
              <div className="text-xs font-bold text-white group-hover:text-[#e8ebef] transition line-clamp-1 mb-1.5">
                {tpl.title}
              </div>
              <span className="text-[10px] font-mono text-[#a3a8b0] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                {tpl.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#a3a8b0]">
          <span className="font-bold uppercase tracking-wider">Your Multi-Model Prompt</span>
          <span className="font-mono">Highlights subtasks & routes automatically</span>
        </div>

        <div className="relative p-4 rounded-2xl bg-black/40 border border-white/10 focus-within:border-white/30 transition">
          <textarea
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter a task or prompt with multiple requirements (e.g. 1. Write a Python API, 2. Derive mathematical complexity, 3. Draft marketing copy). The system will highlight and route each part to the perfect LLM!"
            rows={5}
            disabled={isExecuting}
            className="w-full bg-transparent text-sm sm:text-[15px] font-sans text-[#eef0f2] placeholder:text-[#6c717a] focus:outline-none resize-y leading-relaxed"
          />

          {prompt && (
            <button
              onClick={() => onChange('')}
              className="absolute top-3.5 right-3.5 text-xs text-[#a3a8b0] hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 transition font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Model Capabilities Bar & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Model badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#a3a8b0] mr-1">Active Ensemble:</span>
          {AVAILABLE_MODELS.slice(0, 5).map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border"
              style={{
                backgroundColor: `${m.accentColor}12`,
                borderColor: `${m.accentColor}35`,
                color: m.accentColor
              }}
            >
              <ModelIcon name={m.avatarIcon} className="w-3 h-3" />
              <span>{m.name.split(' ')[0]}</span>
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAnalyze(prompt)}
            disabled={!prompt.trim() || isAnalyzing || isExecuting}
            className="rf-btn rf-btn-primary h-11 px-6 text-sm font-bold shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                <span>Analyzing & Highlighting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Analyze & Highlight Prompt</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
