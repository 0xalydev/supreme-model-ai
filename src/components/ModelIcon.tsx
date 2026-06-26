import React from 'react';
import { 
  Code2, 
  Sparkles, 
  BrainCircuit, 
  Globe2, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Cpu, 
  Bot, 
  Layers, 
  Workflow, 
  Split, 
  ArrowRightLeft,
  Settings2,
  Play,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Terminal,
  Activity,
  BarChart3
} from 'lucide-react';

interface ModelIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ModelIcon: React.FC<ModelIconProps> = ({ name, className = 'w-5 h-5', style }) => {
  switch (name) {
    case 'Code2':
      return <Code2 className={className} style={style} />;
    case 'Sparkles':
      return <Sparkles className={className} style={style} />;
    case 'BrainCircuit':
      return <BrainCircuit className={className} style={style} />;
    case 'Globe2':
      return <Globe2 className={className} style={style} />;
    case 'Zap':
      return <Zap className={className} style={style} />;
    case 'Flame':
      return <Flame className={className} style={style} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} style={style} />;
    case 'Cpu':
      return <Cpu className={className} style={style} />;
    case 'Layers':
      return <Layers className={className} style={style} />;
    case 'Workflow':
      return <Workflow className={className} style={style} />;
    case 'Split':
      return <Split className={className} style={style} />;
    case 'ArrowRightLeft':
      return <ArrowRightLeft className={className} style={style} />;
    case 'Settings2':
      return <Settings2 className={className} style={style} />;
    case 'Play':
      return <Play className={className} style={style} />;
    case 'RotateCcw':
      return <RotateCcw className={className} style={style} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} style={style} />;
    case 'Copy':
      return <Copy className={className} style={style} />;
    case 'Check':
      return <Check className={className} style={style} />;
    case 'Terminal':
      return <Terminal className={className} style={style} />;
    case 'Activity':
      return <Activity className={className} style={style} />;
    case 'BarChart3':
      return <BarChart3 className={className} style={style} />;
    default:
      return <Bot className={className} style={style} />;
  }
};
