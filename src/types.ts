export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'deepseek' | 'groq' | 'ollama';

export type TaskCategory = 
  | 'code' 
  | 'creative' 
  | 'reasoning' 
  | 'summary' 
  | 'multimodal' 
  | 'system_design' 
  | 'general';

export type TargetLanguage = 
  | 'typescript' 
  | 'python' 
  | 'go' 
  | 'rust' 
  | 'java' 
  | 'cpp' 
  | 'solidity';

export type SpecTab = 
  | 'requirements' 
  | 'design' 
  | 'tasks' 
  | 'correctness' 
  | 'codebase';

export type AgentRole = 
  | 'lead_architect' 
  | 'core_systems' 
  | 'api_frontend' 
  | 'qa_correctness';

export interface LLMModel {
  id: string;
  name: string;
  openRouterModelId: string;
  creditMultiplier: string;
  provider: ModelProvider;
  providerLabel: string;
  tagline: string;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
  textColor: string;
  avatarIcon: string;
  strengths: string[];
  bestCategories: TaskCategory[];
  speedRating: number;
  intelligenceRating: number;
  codingRating: number;
  contextWindow: string;
  costPer1kTokens: string;
  description: string;
}

export interface PromptSegment {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  category: TaskCategory;
  categoryLabel: string;
  assignedModelId: string;
  suggestedModelId: string;
  confidence: number;
  reasoning: string;
  isUserOverridden?: boolean;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'switched' | 'error';

export interface ModelHandoff {
  timestamp: number;
  fromModelId: string;
  toModelId: string;
  atCharIndex: number;
  reason: string;
  note: string;
  autoDetected?: boolean;
}

export interface SegmentExecution {
  segmentId: string;
  modelId: string;
  status: ExecutionStatus;
  output: string;
  tokensGenerated: number;
  latencyMs: number;
  startTime?: number;
  endTime?: number;
  handoffs: ModelHandoff[];
  error?: string;
}

export interface AutonomousPhase {
  id: string;
  phaseIndex: number;
  phaseTitle: string;
  category: TaskCategory;
  modelId: string;
  reason: string;
  status: 'pending' | 'running' | 'completed';
  content: string;
  tokenCount: number;
  latencyMs: number;
}

export interface AutoSwitchEvent {
  id: string;
  timestamp: number;
  fromModelId: string;
  toModelId: string;
  reason: string;
  phaseTitle: string;
  atCharLength: number;
}

export interface AutonomousRelayState {
  isRunning: boolean;
  activeModelId: string;
  currentPhaseIndex: number;
  phases: AutonomousPhase[];
  autoSwitches: AutoSwitchEvent[];
  streamedOutput: string;
  totalTokens: number;
  startedAt: number;
  completedAt?: number;
}

export interface PipelineExecutionState {
  isActive: boolean;
  totalTokens: number;
  startedAt: number;
  finishedAt?: number;
  segmentExecutions: Record<string, SegmentExecution>;
  synthesizedOutput: string;
  synthesisStatus: ExecutionStatus;
}

export interface MultiAgentSession {
  id: string;
  role: AgentRole;
  roleTitle: string;
  agentName: string;
  modelId: string;
  openRouterModel: string;
  status: ExecutionStatus;
  currentTask: string;
  output: string;
  tokensGenerated: number;
  latencyMs: number;
  handoffs: ModelHandoff[];
}

export interface GeneratedCodeFile {
  path: string;
  language: string;
  content: string;
  description: string;
}

export interface KiroSpecState {
  title: string;
  summary: string;
  targetLanguage: TargetLanguage;
  requirementsMarkdown: string;
  architectureMarkdown: string;
  tasksMarkdown: string;
  propertyTestsMarkdown: string;
  codeFiles: GeneratedCodeFile[];
  agents: MultiAgentSession[];
  isGenerating: boolean;
  activeTab: SpecTab;
  totalTokens: number;
  handoffCount: number;
  selectedModelId: string;
}

export interface ApiKeysConfig {
  openRouter?: string;
  gemini?: string;
  openAi?: string;
  anthropic?: string;
  groq?: string;
  ollamaUrl?: string;
}

export interface AppSettings {
  useDemoSimulator: boolean;
  activeMode: 'kiro_spec' | 'auto_relay' | 'interactive';
  routingStrategy: 'balanced' | 'highest_quality' | 'fastest' | 'cost_saver';
  autoStartOnAnalyze: boolean;
  autonomousAutoSwitch: boolean;
  apiKeys: ApiKeysConfig;
}
