import React, { useState } from 'react';
import { Copy, Check, Terminal, Sparkles, ArrowRightLeft } from 'lucide-react';

interface FormattedOutputProps {
  content: string;
  isStreaming?: boolean;
}

export const FormattedOutput: React.FC<FormattedOutputProps> = ({ content, isStreaming }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse markdown code blocks and mid-stream handoff alerts
  const renderFormattedContent = () => {
    if (!content) return null;

    // Check for mid-stream switches
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentTextBlock: string[] = [];
    let insideCodeBlock = false;
    let codeLanguage = '';
    let currentCodeBlock: string[] = [];
    let blockIndex = 0;

    const flushTextBlock = () => {
      if (currentTextBlock.length > 0) {
        const text = currentTextBlock.join('\n');
        elements.push(
          <div key={`text-${blockIndex++}`} className="space-y-2 text-slate-300 leading-relaxed text-sm">
            {renderInlineMarkdown(text)}
          </div>
        );
        currentTextBlock = [];
      }
    };

    lines.forEach((line, i) => {
      if (line.startsWith('```')) {
        if (!insideCodeBlock) {
          flushTextBlock();
          insideCodeBlock = true;
          codeLanguage = line.slice(3).trim() || 'text';
          currentCodeBlock = [];
        } else {
          insideCodeBlock = false;
          const codeString = currentCodeBlock.join('\n');
          const idx = blockIndex++;
          elements.push(
            <div key={`code-${idx}`} className="my-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono font-medium text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {codeLanguage}
                </span>
                <button
                  onClick={() => handleCopyCode(codeString, idx)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 transition text-slate-300 hover:text-white"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed selection:bg-indigo-500/40">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }
      } else if (insideCodeBlock) {
        currentCodeBlock.push(line);
      } else if (line.includes('[AUTONOMOUS MODEL HANDOFF') || line.includes('[AUTONOMOUS MODEL SWITCH') || line.includes('[MID-STREAM MODEL SWITCH]')) {
        flushTextBlock();
        const isAutonomous = line.includes('AUTONOMOUS');
        elements.push(
          <div 
            key={`handoff-${blockIndex++}`} 
            className={`my-5 p-3.5 rounded-2xl border shadow-xl flex items-center gap-3.5 animate-in fade-in zoom-in-95 duration-200 ${
              isAutonomous 
                ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-indigo-950/50 to-slate-900/80 shadow-amber-500/10'
                : 'border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/60'
            }`}
          >
            <div 
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isAutonomous
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
              }`}
            >
              {isAutonomous ? (
                <Sparkles className="w-5 h-5 animate-pulse" />
              ) : (
                <ArrowRightLeft className="w-4 h-4 animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span 
                  className={`text-xs font-extrabold uppercase tracking-wider ${
                    isAutonomous ? 'text-amber-300' : 'text-indigo-300'
                  }`}
                >
                  {isAutonomous ? '⚡ Fully Autonomous Model Handoff' : '🔀 Dynamic Model Switch'}
                </span>
                <span 
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full border ${
                    isAutonomous
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30'
                  }`}
                >
                  {isAutonomous ? 'Auto-Triggered Mid-Stream' : 'Context Preserved'}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                {line
                  .replace(/^>\s*⚡\s*\*\*\[AUTONOMOUS MODEL HANDOFF:.*?\*\*:\s*/, '')
                  .replace(/^>\s*🔄\s*\*\*Auto-Switch Triggered:\*\*\s*/, '')
                  .replace(/^>\s*🔀\s*\*\*\[MID-STREAM MODEL SWITCH\]\*\*:\s*/, '')
                  .replace(/^>\s*/, '')}
              </div>
            </div>
          </div>
        );
      } else if (line.startsWith('<think>') || line.startsWith('</think>')) {
        flushTextBlock();
        elements.push(
          <div key={`think-${blockIndex++}`} className="text-xs font-mono text-amber-400/80 italic py-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{line.startsWith('<think>') ? 'Deep Chain-of-Thought Reasoning...' : 'Reasoning Process Concluded'}</span>
          </div>
        );
      } else {
        currentTextBlock.push(line);
      }
    });

    flushTextBlock();
    return elements;
  };

  const renderInlineMarkdown = (text: string) => {
    const paragraphs = text.split('\n');
    return paragraphs.map((para, idx) => {
      if (!para.trim()) return <div key={idx} className="h-1.5" />;

      // Header 2/3
      if (para.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-100 mt-3 mb-1">
            {para.replace('### ', '')}
          </h3>
        );
      }
      if (para.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-indigo-200 mt-3 mb-1 pb-1 border-b border-slate-800">
            {para.replace('## ', '')}
          </h2>
        );
      }

      // Bullet item
      if (para.startsWith('• ') || para.startsWith('- ') || para.startsWith('* ')) {
        const itemText = para.replace(/^[•\-*]\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 text-xs">
            <span className="text-indigo-400 mt-0.5">•</span>
            <span>{formatBoldCode(itemText)}</span>
          </div>
        );
      }

      // Numbered item
      if (/^\d+\.\s+/.test(para)) {
        const num = para.match(/^(\d+\.)\s+/)?.[1];
        const itemText = para.replace(/^\d+\.\s+/, '');
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 text-xs">
            <span className="font-mono text-indigo-400 text-[11px] mt-0.5">{num}</span>
            <span>{formatBoldCode(itemText)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-xs leading-relaxed">
          {formatBoldCode(para)}
        </p>
      );
    });
  };

  const formatBoldCode = (text: string) => {
    // Basic bold and code span formatting
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <span key={i} className="font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 text-xs">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-1 ${isStreaming ? 'streaming-cursor' : ''}`}>
      {renderFormattedContent()}
    </div>
  );
};
