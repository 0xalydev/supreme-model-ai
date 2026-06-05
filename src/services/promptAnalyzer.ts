import { PromptSegment, TaskCategory, AutonomousPhase } from '../types';

interface IntentRule {
  category: TaskCategory;
  suggestedModelId: string;
  categoryLabel: string;
  keywords: string[];
  patterns: RegExp[];
  reasoningTemplate: string;
}

const INTENT_RULES: IntentRule[] = [
  {
    category: 'code',
    suggestedModelId: 'claude-3-5-sonnet',
    categoryLabel: 'Code & Software Architecture',
    keywords: [
      'code', 'function', 'class', 'react', 'python', 'javascript', 'typescript',
      'api', 'backend', 'frontend', 'sql', 'database', 'html', 'css', 'rust',
      'golang', 'component', 'endpoint', 'debug', 'refactor', 'algorithm',
      'script', 'docker', 'npm', 'git', 'bug', 'syntax', 'node', 'express'
    ],
    patterns: [
      /\b(write|create|implement|build|fix|debug|refactor)\s+(a|the|some)?\s*(code|function|script|component|api|class|app|server|endpoint)\b/i,
      /\b(in\s+(python|typescript|javascript|c\+\+|rust|java|go|php|ruby|sql|react))\b/i,
      /```[\s\S]*?```/
    ],
    reasoningTemplate: 'Technical programming, code generation or debugging task detected. Routed to Claude 3.5 Sonnet for state-of-the-art coding precision and syntax reliability.'
  },
  {
    category: 'reasoning',
    suggestedModelId: 'deepseek-r1',
    categoryLabel: 'Mathematical & Logical Reasoning',
    keywords: [
      'math', 'calculate', 'prove', 'proof', 'equation', 'formula', 'theorem',
      'derive', 'integral', 'probability', 'complexity', 'o(n)', 'big-o',
      'logic', 'deduce', 'puzzle', 'game theory', 'formal', 'discrete', 'quantum'
    ],
    patterns: [
      /\b(calculate|compute|prove|derive|evaluate|solve)\s+(the)?\s*(formula|equation|math|value|integral|proof|complexity|probability)\b/i,
      /\b(step-by-step\s+reasoning|logical\s+proof|chain\s+of\s+thought)\b/i
    ],
    reasoningTemplate: 'Heavy mathematical derivation, complex logic or formal proof detected. Routed to DeepSeek R1 for deep chain-of-thought verification.'
  },
  {
    category: 'creative',
    suggestedModelId: 'gpt-4o',
    categoryLabel: 'Creative Writing & Marketing Copy',
    keywords: [
      'story', 'poem', 'marketing', 'copy', 'tweet', 'linkedin', 'blog',
      'creative', 'engaging', 'dialogue', 'script', 'narrative', 'metaphor',
      'pitch', 'headline', 'slogan', 'social media', 'tone', 'persona', 'fiction'
    ],
    patterns: [
      /\b(write|draft|create|compose)\s+(a|an)?\s*(story|poem|marketing|tweet|post|pitch|email|blog|slogan|caption)\b/i,
      /\b(in\s+a\s+(witty|funny|compelling|engaging|dramatic|persuasive)\s+tone)\b/i
    ],
    reasoningTemplate: 'Creative prose, persuasive marketing copy, or conversational tone required. Routed to GPT-4o for natural human fluency and creative flair.'
  },
  {
    category: 'summary',
    suggestedModelId: 'gemini-1-5-flash',
    categoryLabel: 'Fast Summary & Extraction',
    keywords: [
      'summarize', 'summary', 'tldr', 'bullet points', 'brief', 'quick',
      'overview', 'key takeaways', 'extract', 'list down', 'highlight key',
      'short version', 'condense'
    ],
    patterns: [
      /\b(summarize|give\s+a\s+summary|tldr|key\s+takeaways|briefly\s+explain|condense)\b/i,
      /\b(in\s+(3|5|few)\s+(bullet\s+points|bullets|lines))\b/i
    ],
    reasoningTemplate: 'Concise summary or rapid information extraction requested. Routed to Gemini 1.5 Flash / Groq for instantaneous ultra-fast response.'
  },
  {
    category: 'multimodal',
    suggestedModelId: 'gemini-1-5-pro',
    categoryLabel: 'Deep Research & High-Context Analysis',
    keywords: [
      'deep dive', 'research', 'analyze', 'comprehensive', 'survey',
      'literature review', 'multimodal', 'long document', 'compare and contrast',
      'in-depth analysis', 'exhaustive', 'industry trends'
    ],
    patterns: [
      /\b(deep\s+dive|in-depth\s+analysis|comprehensive\s+report|exhaustive\s+research)\b/i,
      /\b(compare\s+and\s+contrast\s+across)\b/i
    ],
    reasoningTemplate: 'Broad contextual analysis, deep research or exhaustive synthesis required. Routed to Gemini 1.5 Pro for its 2M token context and synthesis capabilities.'
  },
  {
    category: 'system_design',
    suggestedModelId: 'claude-3-5-sonnet',
    categoryLabel: 'System Architecture & Engineering',
    keywords: [
      'architecture', 'system design', 'microservices', 'database schema',
      'scalability', 'infra', 'kubernetes', 'aws', 'high availability',
      'caching', 'load balancer', 'data pipeline', 'distributed system'
    ],
    patterns: [
      /\b(design\s+a|architect\s+a|system\s+design|infrastructure|database\s+schema)\b/i
    ],
    reasoningTemplate: 'High-level systems design and engineering trade-offs required. Routed to Claude 3.5 Sonnet for robust architectural best practices.'
  }
];

export function analyzeAndDecomposePrompt(rawPrompt: string): PromptSegment[] {
  const trimmed = rawPrompt.trim();
  if (!trimmed) return [];

  // Step 1: Detect explicit structural splits (numbered items, bullet points, or transition words)
  const segmentsText = splitPromptIntoSubtasks(trimmed);

  // Step 2: Classify each segment
  let currentOffset = 0;
  return segmentsText.map((segmentText, index) => {
    const startIndex = rawPrompt.indexOf(segmentText, currentOffset);
    const endIndex = startIndex !== -1 ? startIndex + segmentText.length : currentOffset + segmentText.length;
    currentOffset = endIndex;

    const classification = classifySingleSegment(segmentText);

    return {
      id: `seg-${index + 1}-${Date.now().toString(36)}`,
      text: segmentText,
      startIndex: startIndex !== -1 ? startIndex : 0,
      endIndex,
      category: classification.category,
      categoryLabel: classification.categoryLabel,
      assignedModelId: classification.suggestedModelId,
      suggestedModelId: classification.suggestedModelId,
      confidence: classification.confidence,
      reasoning: classification.reasoning
    };
  });
}

function splitPromptIntoSubtasks(text: string): string[] {
  // If text has markdown list or numbered points, split by those
  const numberedPattern = /(?:^|\n)(?:\d+[\.\)]\s+|[-*•]\s+)/g;
  if (numberedPattern.test(text)) {
    const items = text.split(/(?:^|\n)(?:\d+[\.\)]\s+|[-*•]\s+)/).map(s => s.trim()).filter(Boolean);
    if (items.length > 1) {
      return items;
    }
  }

  // Check for multi-paragraph text
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length > 1 && paragraphs.length <= 5) {
    return paragraphs;
  }

  // Check for logical sentence separators with intent transitions:
  const transitionSplitPattern = /(?<=[.!?])\s+(?=(?:Also|Then|Next|Now|After that|Secondly|Thirdly|Finally|Additionally|Furthermore|In addition|Part\s+\d+:?|Task\s+\d+:?)\b)/i;
  const sentenceSplits = text.split(transitionSplitPattern).map(s => s.trim()).filter(Boolean);
  if (sentenceSplits.length > 1) {
    return sentenceSplits;
  }

  // Check for semicolon or conjunction splits with distinct verbs
  const multiClause = text.split(/(?:;\s*|\s+(?:and\s+also|and\s+then|along\s+with\s+that)\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  if (multiClause.length > 1 && multiClause.length <= 4) {
    return multiClause;
  }

  // Default: single coherent task
  return [text];
}

export function classifySingleSegment(text: string): {
  category: TaskCategory;
  categoryLabel: string;
  suggestedModelId: string;
  confidence: number;
  reasoning: string;
} {
  const lower = text.toLowerCase();
  let bestMatch: IntentRule | null = null;
  let maxScore = 0;

  for (const rule of INTENT_RULES) {
    let score = 0;

    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        score += 35;
      }
    }

    for (const kw of rule.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lower)) {
        score += 15;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && maxScore >= 15) {
    const confidence = Math.min(0.99, Math.max(0.65, 0.5 + maxScore / 100));
    return {
      category: bestMatch.category,
      categoryLabel: bestMatch.categoryLabel,
      suggestedModelId: bestMatch.suggestedModelId,
      confidence: parseFloat(confidence.toFixed(2)),
      reasoning: bestMatch.reasoningTemplate
    };
  }

  if (text.length < 80) {
    return {
      category: 'summary',
      categoryLabel: 'Quick Response',
      suggestedModelId: 'gemini-1-5-flash',
      confidence: 0.80,
      reasoning: 'Short, direct query. Routed to Gemini 1.5 Flash for sub-second response delivery.'
    };
  }

  return {
    category: 'general',
    categoryLabel: 'General Intelligence',
    suggestedModelId: 'gpt-4o',
    confidence: 0.85,
    reasoning: 'General conversational & analytical query. Routed to GPT-4o for balanced reasoning and clear articulation.'
  };
}

/**
 * Plans the autonomous multi-model relay execution sequence.
 * Breaks a task into specialized phases and assigns the ideal model to each.
 */
export function planAutonomousRelayPhases(rawPrompt: string): AutonomousPhase[] {
  const segments = analyzeAndDecomposePrompt(rawPrompt);

  if (segments.length > 1) {
    return segments.map((seg, idx) => ({
      id: `phase-${idx + 1}-${Date.now().toString(36)}`,
      phaseIndex: idx + 1,
      phaseTitle: `Part ${idx + 1}: ${seg.categoryLabel}`,
      category: seg.category,
      modelId: seg.assignedModelId,
      reason: seg.reasoning,
      status: 'pending',
      content: seg.text,
      tokenCount: 0,
      latencyMs: 0
    }));
  }

  const text = rawPrompt.trim();
  const lower = text.toLowerCase();

  const isCode = /code|function|react|typescript|python|api|app|build|script|endpoint|server|database/i.test(lower);
  const isMath = /math|proof|algorithm|complexity|derive|calculate|solve|optimal|verify/i.test(lower);
  const isCreative = /pitch|tweet|story|copy|market|explain|announce|launch|thread/i.test(lower);

  const phases: AutonomousPhase[] = [];
  let phaseNum = 1;

  if (isCode) {
    phases.push({
      id: `phase-${phaseNum++}`,
      phaseIndex: phases.length + 1,
      phaseTitle: 'Phase 1: Architecture & Code Implementation',
      category: 'code',
      modelId: 'claude-3-5-sonnet',
      reason: 'Auto-routed to Claude 3.5 Sonnet for production-grade code & strict typing.',
      status: 'pending',
      content: text,
      tokenCount: 0,
      latencyMs: 0
    });
  }

  if (isMath || isCode) {
    phases.push({
      id: `phase-${phaseNum++}`,
      phaseIndex: phases.length + 1,
      phaseTitle: 'Phase 2: Algorithmic Complexity & Formal Verification',
      category: 'reasoning',
      modelId: 'deepseek-r1',
      reason: 'Auto-switched to DeepSeek R1 for deep mathematical bounds and runtime complexity proofs.',
      status: 'pending',
      content: text,
      tokenCount: 0,
      latencyMs: 0
    });
  }

  if (isCreative || phases.length > 0) {
    phases.push({
      id: `phase-${phaseNum++}`,
      phaseIndex: phases.length + 1,
      phaseTitle: 'Phase 3: Executive Summary & Launch Pitch',
      category: 'creative',
      modelId: 'gpt-4o',
      reason: 'Auto-switched to GPT-4o for compelling user messaging and natural conversational prose.',
      status: 'pending',
      content: text,
      tokenCount: 0,
      latencyMs: 0
    });
  }

  if (phases.length === 0) {
    const single = segments[0] || classifySingleSegment(text);
    phases.push({
      id: `phase-1`,
      phaseIndex: 1,
      phaseTitle: `Phase 1: ${single.categoryLabel}`,
      category: single.category,
      modelId: single.suggestedModelId || 'gpt-4o',
      reason: single.reasoning,
      status: 'pending',
      content: text,
      tokenCount: 0,
      latencyMs: 0
    });
  }

  return phases;
}
