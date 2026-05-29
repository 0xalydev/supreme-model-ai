import { LLMModel } from '../types';

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    openRouterModelId: 'anthropic/claude-3.5-sonnet',
    creditMultiplier: '1.3x',
    provider: 'anthropic',
    providerLabel: 'Anthropic (via OpenRouter)',
    tagline: 'Best-in-class coding & architectural spec precision',
    accentColor: '#8b5cf6', // purple-500
    borderColor: 'border-purple-500/50',
    bgGlow: 'bg-purple-500/10 hover:bg-purple-500/15',
    textColor: 'text-purple-400',
    avatarIcon: 'Code2',
    strengths: ['Code Generation', 'System Architecture', 'Spec Formalization', 'Bug Fixing'],
    bestCategories: ['code', 'system_design'],
    speedRating: 8.5,
    intelligenceRating: 9.8,
    codingRating: 9.9,
    contextWindow: '200K',
    costPer1kTokens: '$0.003',
    description: 'Gold standard for multi-agent architecture specs, robust type hierarchies, and edge-case prevention.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    openRouterModelId: 'openai/gpt-4o',
    creditMultiplier: '2.2x',
    provider: 'openai',
    providerLabel: 'OpenAI (via OpenRouter)',
    tagline: 'High-speed reasoning, API integration & doc synthesis',
    accentColor: '#10b981', // emerald-500
    borderColor: 'border-emerald-500/50',
    bgGlow: 'bg-emerald-500/10 hover:bg-emerald-500/15',
    textColor: 'text-emerald-400',
    avatarIcon: 'Sparkles',
    strengths: ['API Handler Design', 'Client Documentation', 'Natural Dialogue', 'Integration Testing'],
    bestCategories: ['creative', 'general'],
    speedRating: 9.0,
    intelligenceRating: 9.6,
    codingRating: 9.2,
    contextWindow: '128K',
    costPer1kTokens: '$0.0025',
    description: 'Supreme fluency in multi-agent communication, structured API design, and client-facing documentation.'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    openRouterModelId: 'deepseek/deepseek-r1',
    creditMultiplier: '0.4x',
    provider: 'deepseek',
    providerLabel: 'DeepSeek (via OpenRouter)',
    tagline: 'Deep chain-of-thought mathematical reasoning & bounds proofs',
    accentColor: '#f97316', // orange-500
    borderColor: 'border-orange-500/50',
    bgGlow: 'bg-orange-500/10 hover:bg-orange-500/15',
    textColor: 'text-orange-400',
    avatarIcon: 'BrainCircuit',
    strengths: ['Property-Based Tests', 'Mathematical Verification', 'Algorithmic Bounds', 'Invariant Derivation'],
    bestCategories: ['reasoning'],
    speedRating: 7.2,
    intelligenceRating: 9.7,
    codingRating: 9.4,
    contextWindow: '64K',
    costPer1kTokens: '$0.0005',
    description: 'Frontier reasoning model for property-based test verification, algorithmic invariants, and mathematical bounds.'
  },
  {
    id: 'gemini-1-5-flash',
    name: 'Gemini 1.5 Flash',
    openRouterModelId: 'google/gemini-flash-1.5',
    creditMultiplier: '0.25x',
    provider: 'google',
    providerLabel: 'Google (via OpenRouter)',
    tagline: 'Sub-second latency & rapid task decomposition',
    accentColor: '#06b6d4', // cyan-500
    borderColor: 'border-cyan-500/50',
    bgGlow: 'bg-cyan-500/10 hover:bg-cyan-500/15',
    textColor: 'text-cyan-400',
    avatarIcon: 'Zap',
    strengths: ['Lightning Summarization', 'Fast Q&A', 'Cost Efficiency', 'Information Extraction'],
    bestCategories: ['summary', 'general'],
    speedRating: 9.8,
    intelligenceRating: 8.8,
    codingRating: 8.5,
    contextWindow: '1M',
    costPer1kTokens: '$0.000075',
    description: 'Blazing fast, ultra low-cost model optimized for sub-agents, quick checks, and real-time response generation.'
  },
  {
    id: 'groq-llama-3-3',
    name: 'Llama 3.3 70B (Groq/OpenRouter)',
    openRouterModelId: 'meta-llama/llama-3.3-70b-instruct',
    creditMultiplier: '0.2x',
    provider: 'groq',
    providerLabel: 'Meta / Groq (via OpenRouter)',
    tagline: 'Ultra high-speed open weights execution',
    accentColor: '#f59e0b', // amber-500
    borderColor: 'border-amber-500/50',
    bgGlow: 'bg-amber-500/10 hover:bg-amber-500/15',
    textColor: 'text-amber-400',
    avatarIcon: 'Flame',
    strengths: ['Ultra High Speed', 'Instant Data Filtering', 'Structured JSON Output', 'Rapid Prototyping'],
    bestCategories: ['summary', 'general'],
    speedRating: 10.0,
    intelligenceRating: 9.1,
    codingRating: 8.8,
    contextWindow: '128K',
    costPer1kTokens: '$0.00059',
    description: 'Open-weights powerhouse delivering high throughput for parallel multi-agent task execution.'
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    openRouterModelId: 'google/gemini-pro-1.5',
    creditMultiplier: '1.2x',
    provider: 'google',
    providerLabel: 'Google (via OpenRouter)',
    tagline: '2M context, repo-scale analysis & multimodal synthesis',
    accentColor: '#3b82f6', // blue-500
    borderColor: 'border-blue-500/50',
    bgGlow: 'bg-blue-500/10 hover:bg-blue-500/15',
    textColor: 'text-blue-400',
    avatarIcon: 'Globe2',
    strengths: ['Massive Context Analysis', 'Deep Research', 'Multimodal Synthesis', 'Cross-Document Query'],
    bestCategories: ['multimodal', 'summary'],
    speedRating: 8.0,
    intelligenceRating: 9.5,
    codingRating: 9.0,
    contextWindow: '2M',
    costPer1kTokens: '$0.00125',
    description: 'Industry-leading 2M token context window for repo-scale code ingestion and cross-module tracing.'
  }
];

export const MODEL_MAP: Record<string, LLMModel> = AVAILABLE_MODELS.reduce((acc, model) => {
  acc[model.id] = model;
  return acc;
}, {} as Record<string, LLMModel>);
