import React, { useState, useRef, useEffect } from 'react';
import { ModelHandoff } from '../types';
import { AVAILABLE_MODELS, MODEL_MAP } from '../data/models';
import { ModelIcon } from './ModelIcon';
import { FormattedOutput } from './FormattedOutput';
import { orchestratorService, ActiveStreamController } from '../services/llmService';
import { 
  Send, 
  ArrowRightLeft, 
  ChevronDown, 
  Activity, 
  User
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  modelId?: string;
  handoffs?: ModelHandoff[];
  isStreaming?: boolean;
}

export const InteractiveHandoffView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'model',
      modelId: 'claude-3-5-sonnet',
      text: `Hello! I am your dynamic multi-model assistant. 

You can ask me to write code, solve math problems, or draft marketing copy. While I am generating—or anytime during our conversation—you can click **"Switch Model Mid-Stream"** to instantly hand off execution to another model (like DeepSeek R1, GPT-4o, or Gemini 1.5 Pro) with full context preserved!

Try giving me a multi-stage request!`,
      handoffs: []
    }
  ]);

  const [input, setInput] = useState('');
  const [currentModelId, setCurrentModelId] = useState<string>('claude-3-5-sonnet');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSwitchMenuOpen, setIsSwitchMenuOpen] = useState(false);
  
  const activeControllerRef = useRef<ActiveStreamController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || isGenerating) return;

    const userPrompt = input.trim();
    setInput('');

    const userMsgId = `user-${Date.now()}`;
    const modelMsgId = `model-${Date.now()}`;

    // Add user message and blank model response placeholder
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: userPrompt },
      { id: modelMsgId, sender: 'model', modelId: currentModelId, text: '', isStreaming: true, handoffs: [] }
    ]);

    setIsGenerating(true);

    const controller = orchestratorService.executeSegmentStream(
      modelMsgId,
      userPrompt,
      currentModelId,
      'Interactive chat conversation',
      {
        onToken: (_chunk, fullText) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMsgId ? { ...msg, text: fullText } : msg
            )
          );
        },
        onHandoff: (handoff) => {
          setCurrentModelId(handoff.toModelId);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === modelMsgId
                ? { ...msg, modelId: handoff.toModelId, handoffs: [...(msg.handoffs || []), handoff] }
                : msg
            )
          );
        },
        onComplete: (finalText) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === modelMsgId
                ? { ...msg, text: finalText, isStreaming: false }
                : msg
            )
          );
          setIsGenerating(false);
          activeControllerRef.current = null;
        },
        onError: (err) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === modelMsgId
                ? { ...msg, text: `Error: ${err}`, isStreaming: false }
                : msg
            )
          );
          setIsGenerating(false);
          activeControllerRef.current = null;
        }
      }
    );

    activeControllerRef.current = controller;
  };

  const handleTriggerSwitch = async (newModelId: string) => {
    setIsSwitchMenuOpen(false);
    if (activeControllerRef.current && isGenerating) {
      // Mid-stream switch during active generation!
      await activeControllerRef.current.switchModel(newModelId);
    } else {
      // Just change current model for next message
      setCurrentModelId(newModelId);
    }
  };

  const currentModel = MODEL_MAP[currentModelId] || MODEL_MAP['claude-3-5-sonnet'];

  return (
    <div className="rf-glass overflow-hidden flex flex-col h-[720px] max-w-[960px] mx-auto animate-in fade-in duration-300">
      {/* Chat Top Bar */}
      <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md"
            style={{
              backgroundColor: `${currentModel.accentColor}25`,
              borderColor: `${currentModel.accentColor}60`,
              color: currentModel.accentColor
            }}
          >
            <ModelIcon name={currentModel.avatarIcon} className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentModel.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#a3a8b0]">
                Active Authority
              </span>
              {isGenerating && (
                <span className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono animate-pulse">
                  <Activity className="w-3 h-3 animate-spin text-amber-400" />
                  Generating...
                </span>
              )}
            </div>
            <div className="text-xs text-[#a3a8b0]">{currentModel.tagline}</div>
          </div>
        </div>

        {/* MID-STREAM MODEL SWITCHER BUTTON */}
        <div className="relative">
          <button
            onClick={() => setIsSwitchMenuOpen(!isSwitchMenuOpen)}
            className="rf-btn rf-btn-primary h-9 px-4 text-xs font-bold shadow-md"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-black mr-1" />
            <span>Switch Model Mid-Stream</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70 ml-1 text-black" />
          </button>

          {/* Switch Dropdown Menu */}
          {isSwitchMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#131417] border border-white/15 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2.5 py-1.5 border-b border-white/10 mb-1.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isGenerating ? 'Hot-Swap Mid-Generation' : 'Select Active Model'}</span>
                </div>
                <div className="text-[10px] text-[#6c717a] font-mono">
                  {isGenerating ? 'Current context will be seamlessly handed off to new model' : 'Will answer your next query'}
                </div>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {AVAILABLE_MODELS.map(m => {
                  const isCurrent = m.id === currentModelId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleTriggerSwitch(m.id)}
                      disabled={isCurrent}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                        isCurrent 
                          ? 'opacity-40 bg-white/5 text-[#6c717a] cursor-not-allowed'
                          : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${m.accentColor}20`, color: m.accentColor }}
                        >
                          <ModelIcon name={m.avatarIcon} className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{m.name}</div>
                          <div className="text-[10px] text-[#6c717a] line-clamp-1">{m.tagline}</div>
                        </div>
                      </div>
                      {isCurrent && <span className="text-[10px] text-[#6c717a] font-mono">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-black/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const msgModel = msg.modelId ? MODEL_MAP[msg.modelId] : null;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
            >
              {!isUser && msgModel && (
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 border shadow-sm"
                  style={{
                    backgroundColor: `${msgModel.accentColor}20`,
                    borderColor: `${msgModel.accentColor}50`,
                    color: msgModel.accentColor
                  }}
                >
                  <ModelIcon name={msgModel.avatarIcon} className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-1.5">
                {!isUser && msgModel && (
                  <div className="text-[11px] font-semibold text-[#a3a8b0] flex items-center gap-1.5 ml-1">
                    <span>{msgModel.name}</span>
                    {msg.handoffs && msg.handoffs.length > 0 && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                        {msg.handoffs.length} handoff(s)
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-white text-black font-medium rounded-tr-none shadow-md'
                      : 'bg-black/60 border border-white/10 text-[#eef0f2] rounded-tl-none shadow-lg'
                  }`}
                >
                  {isUser ? (
                    <div>{msg.text}</div>
                  ) : (
                    <FormattedOutput content={msg.text} isStreaming={msg.isStreaming} />
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-1 text-white">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-white/10 bg-black/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            placeholder={`Ask ${currentModel.name}... (You can switch model mid-stream anytime)`}
            className="flex-1 bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-[#6c717a] focus:outline-none transition font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="rf-btn rf-btn-primary h-11 w-11 p-0 rounded-2xl disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>
      </div>
    </div>
  );
};
