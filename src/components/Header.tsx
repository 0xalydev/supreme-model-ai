import React from 'react';
import { AppSettings } from '../types';
import { 
  Zap, 
  MessageSquare, 
  Settings2, 
  Sparkles,
  Boxes
} from 'lucide-react';

interface HeaderProps {
  settings: AppSettings;
  activeMode: 'kiro_spec' | 'auto_relay' | 'interactive';
  onModeChange: (mode: 'kiro_spec' | 'auto_relay' | 'interactive') => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeMode,
  onModeChange,
  onOpenSettings
}) => {
  return (
    <header className="sticky top-0 z-40 pt-3.5 px-4 sm:px-6">
      <div className="rf-glass max-w-[1180px] mx-auto h-[62px] flex items-center justify-between gap-3 px-3 sm:px-4 rounded-full">
        {/* Brand Logo */}
        <div 
          onClick={() => onModeChange('kiro_spec')}
          className="flex items-center gap-2.5 cursor-pointer select-none pl-1"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-white via-slate-200 to-slate-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#0c0d0f] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[16.5px] tracking-tight text-white">
              Kiro Studio
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#a3a8b0]">
              OpenRouter AI
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Spec-Driven Kiro.dev IDE style) */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-[13.5px]">
          {[
            { id: 'kiro_spec', label: '📐 Spec-Driven IDE', icon: Boxes },
            { id: 'auto_relay', label: '⚡ Autonomous Relay', icon: Zap },
            { id: 'interactive', label: '💬 Interactive Agent', icon: MessageSquare }
          ].map((item) => {
            const isActive = activeMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id as any)}
                className={`px-3.5 py-1.5 rounded-full transition text-[13px] ${
                  isActive
                    ? 'text-white bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] font-semibold'
                    : 'text-[#a3a8b0] hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Status Pill & Settings */}
        <div className="flex items-center gap-2 pr-1">
          {/* OpenRouter live status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
            <span className="rf-dot-live" />
            <span className="text-[#a3a8b0] text-[11px] font-mono">
              OpenRouter: Connected
            </span>
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="rf-btn rf-btn-glassy h-9 px-3.5 text-xs font-semibold"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1 text-[#a3a8b0]" />
            <span>OpenRouter Config</span>
          </button>
        </div>
      </div>
    </header>
  );
};
