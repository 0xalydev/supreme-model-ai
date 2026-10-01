import React, { useState } from 'react';
import { AppSettings, ApiKeysConfig } from '../types';
import { 
  X, 
  KeyRound, 
  Zap, 
  ShieldCheck, 
  Check, 
  Sliders,
  Activity,
  AlertCircle
} from 'lucide-react';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (updated: Partial<AppSettings>) => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [useDemo, setUseDemo] = useState(settings.useDemoSimulator);
  const [strategy, setStrategy] = useState(settings.routingStrategy);
  const [keys, setKeys] = useState<ApiKeysConfig>({ ...settings.apiKeys });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  if (!isOpen) return null;

  const handleTestOpenRouter = async () => {
    const key = keys.openRouter;
    if (!key) {
      setTestResult({ status: 'error', message: 'Please enter an OpenRouter key to test' });
      return;
    }

    setTestingKey(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });

      const data = await res.json();
      if (res.ok && data?.data) {
        setTestResult({
          status: 'success',
          message: `Connected! Label: ${data.data.label || 'Default'} · Limit: $${data.data.limit || 'Unlimited'}`
        });
      } else {
        setTestResult({
          status: 'error',
          message: data?.error?.message || 'OpenRouter returned 401 Unauthorized. Key might be expired or restricted.'
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Network error: ${err.message || 'Failed to reach openrouter.ai'}`
      });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = () => {
    onSave({
      useDemoSimulator: useDemo,
      routingStrategy: strategy,
      apiKeys: keys
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#131417] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">OpenRouter & Multi-Agent Credentials</h2>
              <p className="text-xs text-[#a3a8b0]">All models (Claude, DeepSeek, GPT-4o, Gemini) connect via OpenRouter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#a3a8b0] hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {/* Primary OpenRouter Key Section */}
          <div className="p-4 rounded-2xl border border-white/15 bg-black/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-white" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  OpenRouter API Key (Universal Multi-Model Hub)
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Powers All Agents</span>
            </div>

            <p className="text-xs text-[#a3a8b0]">
              One single key gives your agents access to Anthropic Claude 3.5/3.7, DeepSeek R1/V3, OpenAI GPT-4o, and Google Gemini.
            </p>

            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={keys.openRouter || ''}
                onChange={(e) => setKeys({ ...keys, openRouter: e.target.value })}
                className="w-full bg-black/50 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestOpenRouter}
                  disabled={testingKey || !keys.openRouter}
                  className="rf-btn rf-btn-glassy h-8 px-3 text-xs"
                >
                  {testingKey ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Testing Key...</span>
                    </>
                  ) : (
                    <span>Test OpenRouter Key</span>
                  )}
                </button>

                <span className="text-[11px] text-[#6c717a] font-mono">
                  Stored securely in local browser
                </span>
              </div>

              {testResult.status === 'success' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{testResult.message}</span>
                </div>
              )}

              {testResult.status === 'error' && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <span>{testResult.message}</span>
                    <div className="text-[#a3a8b0] mt-0.5">
                      (App will automatically use fallback streaming pipeline until valid key is entered)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Mode Toggle Card */}
          <div className="p-4 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5 text-white">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2 text-xs">
                  <span>Fast Simulation Mode</span>
                </div>
                <p className="text-[11px] text-[#a3a8b0] mt-0.5">
                  When enabled, runs multi-agent spec generation instantly without consuming OpenRouter tokens.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={useDemo} 
                onChange={(e) => setUseDemo(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
            </label>
          </div>

          {/* Direct OpenAI Fallback (Optional) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white">Direct OpenAI API Key (Fallback)</span>
              <span className="text-[10px] text-emerald-400 font-mono">GPT-4o Ready</span>
            </div>
            <input
              type="password"
              placeholder="sk-proj-..."
              value={keys.openAi || ''}
              onChange={(e) => setKeys({ ...keys, openAi: e.target.value })}
              className="w-full bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-xs text-[#a3a8b0] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% Client-Side Privacy
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="rf-btn rf-btn-glassy h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rf-btn rf-btn-primary h-9 px-5 text-xs font-bold shadow-md"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black mr-1" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
