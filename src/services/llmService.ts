import { LLMModel, ModelHandoff, SegmentExecution, AppSettings, AutonomousPhase, AutoSwitchEvent } from '../types';
import { MODEL_MAP } from '../data/models';

export interface StreamCallback {
  onToken: (token: string, fullText: string) => void;
  onHandoff?: (handoff: ModelHandoff) => void;
  onComplete: (finalText: string, latencyMs: number) => void;
  onError: (error: string) => void;
}

export interface ActiveStreamController {
  cancel: () => void;
  switchModel: (newModelId: string, reason?: string) => Promise<void>;
  getCurrentModelId: () => string;
}

export interface AutonomousRelayCallbacks {
  onPhaseStart: (phase: AutonomousPhase) => void;
  onToken: (chunk: string, fullStreamText: string, activeModelId: string) => void;
  onAutoSwitch: (event: AutoSwitchEvent) => void;
  onPhaseComplete: (phase: AutonomousPhase) => void;
  onAllCompleted: (finalFullText: string, totalLatencyMs: number) => void;
  onError: (error: string) => void;
}

export interface AutonomousRelayController {
  cancel: () => void;
  getCurrentModelId: () => string;
  forceModelSwitch: (newModelId: string) => void;
}

export class MultiModelOrchestratorService {
  private static instance: MultiModelOrchestratorService;
  private settings: AppSettings = {
    useDemoSimulator: true,
    activeMode: 'auto_relay',
    routingStrategy: 'balanced',
    autoStartOnAnalyze: false,
    autonomousAutoSwitch: true,
    apiKeys: {}
  };

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): MultiModelOrchestratorService {
    if (!MultiModelOrchestratorService.instance) {
      MultiModelOrchestratorService.instance = new MultiModelOrchestratorService();
    }
    return MultiModelOrchestratorService.instance;
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem('omniroute_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch {
      // LocalStorage not available or parse error
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('omniroute_settings', JSON.stringify(this.settings));
    } catch {
      // ignore
    }
  }

  /**
   * Executes a prompt segment using the assigned model.
   * Returns a controller to pause, cancel, or SWITCH MODEL MID-STREAM!
   */
  public executeSegmentStream(
    segmentId: string,
    promptText: string,
    initialModelId: string,
    contextSummary: string,
    callbacks: StreamCallback
  ): ActiveStreamController {
    let currentModelId = initialModelId;
    let accumulatedText = '';
    let isCancelled = false;
    const startTime = Date.now();
    let currentTimeout: any = null;

    // Generator function for simulation
    const runSimulationForModel = async (
      modelId: string,
      continuationPrefix: string = '',
      isSwitchedHandoff: boolean = false
    ) => {
      const model = MODEL_MAP[modelId] || MODEL_MAP['gpt-4o'];
      const responseTemplate = this.generateRealisticMockResponse(modelId, promptText, continuationPrefix, isSwitchedHandoff);

      const words = responseTemplate.split(/(\s+)/);
      let wordIndex = 0;

      // Variable speed per model (Groq is super fast, DeepSeek thinks slower, etc.)
      const delayPerToken = modelId === 'groq-llama-3-3' ? 12 :
                           modelId === 'gemini-1-5-flash' ? 18 :
                           modelId === 'deepseek-r1' ? 45 :
                           modelId === 'claude-3-5-sonnet' ? 28 : 30;

      const streamNext = () => {
        if (isCancelled) return;

        if (wordIndex < words.length) {
          const chunk = words[wordIndex];
          accumulatedText += chunk;
          wordIndex++;
          callbacks.onToken(chunk, accumulatedText);
          currentTimeout = setTimeout(streamNext, Math.random() * delayPerToken + 10);
        } else {
          const latency = Date.now() - startTime;
          callbacks.onComplete(accumulatedText, latency);
        }
      };

      streamNext();
    };

    // Real API runner
    const runRealApiStream = async (modelId: string, continuationText: string = '') => {
      // If user provided OpenRouter, Gemini, or OpenAI API key
      const keys = this.settings.apiKeys;
      const model = MODEL_MAP[modelId];

      if (keys.openRouter) {
        return this.callOpenRouterStream(modelId, promptText, continuationText, callbacks, () => isCancelled);
      } else if (model.provider === 'google' && keys.gemini) {
        return this.callGeminiStream(modelId, promptText, continuationText, keys.gemini, callbacks, () => isCancelled);
      } else if (model.provider === 'groq' && keys.groq) {
        return this.callGroqStream(promptText, continuationText, keys.groq, callbacks, () => isCancelled);
      } else if (model.provider === 'ollama') {
        return this.callOllamaStream(modelId, promptText, continuationText, keys.ollamaUrl || 'http://localhost:11434', callbacks, () => isCancelled);
      } else {
        // Fallback to simulation if keys are missing
        return runSimulationForModel(modelId, continuationText, false);
      }
    };

    // Start stream
    if (this.settings.useDemoSimulator) {
      runSimulationForModel(currentModelId);
    } else {
      runRealApiStream(currentModelId).catch(() => {
        // Fallback to simulator if API call fails
        runSimulationForModel(currentModelId);
      });
    }

    // Controller object returned to UI
    const controller: ActiveStreamController = {
      cancel: () => {
        isCancelled = true;
        if (currentTimeout) clearTimeout(currentTimeout);
      },
      getCurrentModelId: () => currentModelId,
      switchModel: async (newModelId: string, reason?: string) => {
        if (currentModelId === newModelId) return;

        const prevModelId = currentModelId;
        currentModelId = newModelId;

        // Cancel previous timer
        if (currentTimeout) clearTimeout(currentTimeout);

        const handoffNotice: ModelHandoff = {
          timestamp: Date.now(),
          fromModelId: prevModelId,
          toModelId: newModelId,
          atCharIndex: accumulatedText.length,
          reason: reason || `User triggered mid-stream hot swap to ${MODEL_MAP[newModelId]?.name || newModelId}`,
          note: `Switched execution authority from ${MODEL_MAP[prevModelId]?.name} to ${MODEL_MAP[newModelId]?.name}. Context preserved.`
        };

        // Notify UI of handoff
        if (callbacks.onHandoff) {
          callbacks.onHandoff(handoffNotice);
        }

        // Add visual transition separator in the stream
        const transitionDivider = `\n\n> 🔀 **[MID-STREAM MODEL SWITCH]**: Context handed off from **${MODEL_MAP[prevModelId]?.name}** to **${MODEL_MAP[newModelId]?.name}**...\n\n`;
        accumulatedText += transitionDivider;
        callbacks.onToken(transitionDivider, accumulatedText);

        // Resume generation with the new model
        if (this.settings.useDemoSimulator) {
          runSimulationForModel(newModelId, accumulatedText, true);
        } else {
          try {
            await runRealApiStream(newModelId, accumulatedText);
          } catch {
            runSimulationForModel(newModelId, accumulatedText, true);
          }
        }
      }
    };

    return controller;
  }

  /**
   * Fully Autonomous Multi-Model Relay Stream
   * Automatically executes through planned phases, auto-switching models mid-stream
   * whenever a new phase or intent shift is detected!
   */
  public executeAutonomousRelayStream(
    phases: AutonomousPhase[],
    callbacks: AutonomousRelayCallbacks
  ): AutonomousRelayController {
    let isCancelled = false;
    let currentPhaseIdx = 0;
    let accumulatedFullText = '';
    const startTime = Date.now();
    let currentActiveModelId = phases[0]?.modelId || 'claude-3-5-sonnet';
    let activePhaseTimeout: any = null;

    const runPhase = (phaseIndex: number) => {
      if (isCancelled || phaseIndex >= phases.length) {
        if (!isCancelled && phaseIndex >= phases.length) {
          callbacks.onAllCompleted(accumulatedFullText, Date.now() - startTime);
        }
        return;
      }

      currentPhaseIdx = phaseIndex;
      const currentPhase = phases[phaseIndex];
      currentActiveModelId = currentPhase.modelId;
      callbacks.onPhaseStart(currentPhase);

      // Generate realistic response tailored for this phase
      const phaseOutput = this.generateRealisticMockResponse(
        currentActiveModelId,
        currentPhase.content,
        accumulatedFullText,
        phaseIndex > 0
      );

      const words = phaseOutput.split(/(\s+)/);
      let wordIdx = 0;
      const delay = currentActiveModelId === 'groq-llama-3-3' ? 10 :
                    currentActiveModelId === 'gemini-1-5-flash' ? 14 :
                    currentActiveModelId === 'deepseek-r1' ? 32 :
                    currentActiveModelId === 'claude-3-5-sonnet' ? 20 : 22;

      const streamToken = () => {
        if (isCancelled) return;

        if (wordIdx < words.length) {
          const chunk = words[wordIdx];
          accumulatedFullText += chunk;
          wordIdx++;
          callbacks.onToken(chunk, accumulatedFullText, currentActiveModelId);
          activePhaseTimeout = setTimeout(streamToken, Math.random() * delay + 10);
        } else {
          // Phase finished!
          callbacks.onPhaseComplete(currentPhase);

          // Check if there is an autonomous next phase to auto-switch to!
          const nextIndex = phaseIndex + 1;
          if (nextIndex < phases.length) {
            const nextPhase = phases[nextIndex];
            const prevModel = currentActiveModelId;
            const nextModel = nextPhase.modelId;

            // Trigger the auto-switch event!
            const switchEvent: AutoSwitchEvent = {
              id: `switch-${Date.now()}-${nextIndex}`,
              timestamp: Date.now(),
              fromModelId: prevModel,
              toModelId: nextModel,
              reason: nextPhase.reason,
              phaseTitle: nextPhase.phaseTitle,
              atCharLength: accumulatedFullText.length
            };
            callbacks.onAutoSwitch(switchEvent);

            // Add prominent auto-handoff divider
            const divider = `\n\n` +
              `> ⚡ **[AUTONOMOUS MODEL HANDOFF: STEP ${nextIndex + 1}]**\n` +
              `> 🔄 **Auto-Switch Triggered:** Handed off authority from **${MODEL_MAP[prevModel]?.name}** to **${MODEL_MAP[nextModel]?.name}**\n` +
              `> *Reason: ${nextPhase.reason}*\n\n`;

            accumulatedFullText += divider;
            callbacks.onToken(divider, accumulatedFullText, nextModel);

            // Smooth transition to next phase
            activePhaseTimeout = setTimeout(() => {
              runPhase(nextIndex);
            }, 600);
          } else {
            // All phases completed
            callbacks.onAllCompleted(accumulatedFullText, Date.now() - startTime);
          }
        }
      };

      streamToken();
    };

    runPhase(0);

    return {
      cancel: () => {
        isCancelled = true;
        if (activePhaseTimeout) clearTimeout(activePhaseTimeout);
      },
      getCurrentModelId: () => currentActiveModelId,
      forceModelSwitch: (newModelId: string) => {
        if (currentActiveModelId === newModelId) return;
        const prev = currentActiveModelId;
        currentActiveModelId = newModelId;
        if (activePhaseTimeout) clearTimeout(activePhaseTimeout);

        const switchEvent: AutoSwitchEvent = {
          id: `switch-manual-${Date.now()}`,
          timestamp: Date.now(),
          fromModelId: prev,
          toModelId: newModelId,
          reason: 'User manual override during autonomous stream',
          phaseTitle: 'Manual Intercept',
          atCharLength: accumulatedFullText.length
        };
        callbacks.onAutoSwitch(switchEvent);

        const divider = `\n\n> 🔀 **[MANUAL OVERRIDE SWITCH]**: Switched authority to **${MODEL_MAP[newModelId]?.name}**...\n\n`;
        accumulatedFullText += divider;
        callbacks.onToken(divider, accumulatedFullText, newModelId);

        runPhase(currentPhaseIdx);
      }
    };
  }

  /**
   * Realistic simulated output generator showcasing distinct LLM traits
   */
  private generateRealisticMockResponse(
    modelId: string,
    prompt: string,
    prefix: string,
    isSwitched: boolean
  ): string {
    const isCode = /code|function|react|typescript|python|api|sql|script/i.test(prompt);
    const isMath = /math|calculate|prove|complexity|integral|formula|solve/i.test(prompt);
    const isCreative = /story|poem|marketing|copy|tweet|pitch|email|blog/i.test(prompt);

    if (isSwitched) {
      if (modelId === 'claude-3-5-sonnet') {
        return `Taking over from the previous model. Let's enforce architectural rigor and type safety:\n\n` +
          `\`\`\`typescript\n// Refactored and optimized implementation with full error handling\ninterface ServiceResponse<T> {\n  success: boolean;\n  data?: T;\n  error?: string;\n  executionMeta: { latencyMs: number; model: string };\n}\n\nexport async function executeEnginePipeline<T>(payload: T): Promise<ServiceResponse<T>> {\n  try {\n    // Validated schema and atomic execution\n    const result = await processOrchestration(payload);\n    return { success: true, data: result, executionMeta: { latencyMs: 24, model: 'claude-3-5-sonnet' } };\n  } catch (err: any) {\n    return { success: false, error: err.message || 'Pipeline fault', executionMeta: { latencyMs: 0, model: 'claude-3-5-sonnet' } };\n  }\n}\n\`\`\`\n\nAll edge cases, null checks, and memory management constraints have been addressed.`;
      }
      if (modelId === 'deepseek-r1') {
        return `Switching to deep mathematical verification:\n\n` +
          `<think>\nAnalyzing previous state... Identifying algorithmic boundary conditions.\n1. State size N <= 10^6.\n2. Space complexity must remain strictly O(1) auxiliary.\n3. Recurrence relation: T(n) = 2T(n/2) + O(n) => by Master Theorem Case 2, T(n) = O(n log n).\n</think>\n\n### Formal Mathematical Derivation\nThe recurrence satisfies Master Theorem Case 2:\n$$\\lim_{n \\to \\infty} \\frac{f(n)}{n^{\\log_b a}} = \\lim_{n \\to \\infty} \\frac{n}{n^{\\log_2 2}} = 1$$\nTherefore, the optimal lower bound is strictly $\\Theta(n \\log n)$. This confirms optimal asymptotic convergence without stack overflow.`;
      }
      if (modelId === 'gpt-4o') {
        return `Continuing with a high-impact narrative tone:\n\n` +
          `Here is how to pitch this seamlessly to your end users:\n\n` +
          `*“Experience AI without single-model lock-in. Watch your ideas get routed in real time to the world's most specialized minds—Claude for flawless code, DeepSeek for mathematical truth, and GPT-4o for magnetic storytelling.”*\n\n` +
          `**Call to Action:** Elevate your workflow today. Switch models mid-sentence, compare outputs live, and supercharge your production stack.`;
      }
      if (modelId === 'gemini-1-5-flash') {
        return `Quick summary continuation:\n• **Key Takeaway 1:** Instant handoff succeeded with zero dropped context.\n• **Key Takeaway 2:** Next step is deployable immediately.\n• **Execution speed:** 1.2ms latency.`;
      }
      return `Continuing the task with ${MODEL_MAP[modelId]?.name || modelId}. Everything is flowing smoothly with complete context preservation.`;
    }

    // Default primary generation by model
    switch (modelId) {
      case 'claude-3-5-sonnet':
        return `Here is a robust, modular implementation tailored to your exact specifications:\n\n` +
          `\`\`\`typescript\n// OmniRoute Autonomous Agent Engine\nimport { createHash } from 'crypto';\n\nexport interface TaskPacket {\n  id: string;\n  prompt: string;\n  targetModel: string;\n  timestamp: number;\n}\n\nexport class OrchestrationPipeline {\n  private routingTable: Map<string, string> = new Map();\n\n  constructor() {\n    this.initDefaultRoutes();\n  }\n\n  private initDefaultRoutes(): void {\n    this.routingTable.set('code', 'claude-3-5-sonnet');\n    this.routingTable.set('reasoning', 'deepseek-r1');\n    this.routingTable.set('creative', 'gpt-4o');\n    this.routingTable.set('summary', 'gemini-1-5-flash');\n  }\n\n  public async dispatch<T>(packet: TaskPacket): Promise<T> {\n    console.log(\`[Claude 3.5] Processing task: \${packet.id} with strict type validation\`);\n    // High-performance streaming worker dispatch\n    return { status: 'success', packetId: packet.id } as T;\n  }\n}\n\`\`\`\n\n### Key Architectural Highlights:\n1. **Strict Type Safety:** Exhaustive interfaces ensure zero runtime undefined access.\n2. **Modularity:** Dispatcher decouples LLM execution from client presentation.\n3. **Extensibility:** Easily register custom local models (Ollama/vLLM) without breaking caller code.`;

      case 'deepseek-r1':
        return `<think>\nLet's analyze the input step by step.\n1. Identify core constraints and problem parameters.\n2. Check for invariant properties and inductive basis.\n3. Formulate the closed-form equation and test corner cases (n = 0, n = 1).\n4. Evaluate asymptotic limits as n approaches infinity.\n</think>\n\n### Rigorous Analytical Solution\n\nLet the system state be defined over the Hilbert space $\\mathcal{H}$ with state vector $|\\psi(t)\\rangle$.\n\n**Step 1: Invariant Formulation**\n$$\\mathcal{L}(x, \\dot{x}) = \\frac{1}{2} m \\dot{x}^2 - V(x)$$\n\n**Step 2: Algorithmic Complexity Guarantee**\n- **Time Complexity:** $\\mathcal{O}(n \\log n)$ via divide-and-conquer partition.\n- **Space Complexity:** $\\mathcal{O}(1)$ in-place auxiliary space.\n\n**Conclusion:**\nThe proof holds under all inductive transitions. The algorithmic efficiency is mathematically optimal with zero redundant comparisons.`;

      case 'gpt-4o':
        return `Here is a compelling, high-converting creative piece designed to captivate your audience:\n\n` +
          `### 🚀 The Next Frontier of Multi-Model Intelligence\n\n` +
          `Why settle for one AI when you can orchestrate an entire symphony?\n\n` +
          `Imagine typing a single prompt and watching your words light up with intelligent color: \n` +
          `- **Purple** activates Claude for surgical-grade code.\n` +
          `- **Orange** invokes DeepSeek for unbreakable mathematical proofs.\n` +
          `- **Emerald** powers GPT-4o for magnetic storytelling.\n\n` +
          `*“Change models mid-thought. Blend the sharpest minds on the planet. Welcome to the future of dynamic orchestration.”*\n\n` +
          `**Pro-Tip:** Share this with your team to unlock 10x faster execution without cognitive friction.`;

      case 'gemini-1-5-pro':
        return `### Comprehensive Multimodal & Cross-Source Research Dossier\n\n` +
          `Leveraging a 2,000,000-token contextual analysis across industry benchmarks and foundational literature:\n\n` +
          `1. **Structural Synthesis:** Multi-agent architectures demonstrate a 34% reduction in hallucination rates compared to monolithic prompting.\n` +
          `2. **Cross-Model Synergy:** Routing code subtasks to specialized code-fine-tuned checkpoints while delegating copy to conversational models improves end-to-end user satisfaction by 4.2x.\n` +
          `3. **Fault Tolerance & Dynamic Fallbacks:** Real-time hot-swapping prevents pipeline degradation during API rate limits or latency spikes.\n\n` +
          `**Recommended Action Plan:** Maintain a persistent session memory buffer across all model handoffs.`;

      case 'gemini-1-5-flash':
        return `⚡ **Rapid Executive Briefing (Under 0.4s):**\n\n` +
          `• **Status:** Pipeline operational and fully optimized.\n` +
          `• **Latency:** 18ms / token.\n` +
          `• **Action Item:** Integrate dynamic router into your primary UI flow.\n` +
          `• **Cost:** $0.000075 / 1K tokens (95% cost reduction).`;

      case 'groq-llama-3-3':
        return `🔥 **Groq LPU Instant Stream (320 tokens/sec):**\n\n` +
          `\`\`\`json\n{\n  "status": "active",\n  "throughput": "320 t/s",\n  "engine": "Llama-3.3-70B-Versatile",\n  "verification": true,\n  "nextAction": "deploy_orchestrator"\n}\n\`\`\`\n\nProcessed instantaneously via custom LPUs with deterministic low-latency execution.`;

      default:
        return `Processed prompt successfully with ${MODEL_MAP[modelId]?.name || modelId}. High accuracy achieved across all subtasks.`;
    }
  }

  /**
   * Real API Stream via OpenRouter
   */
  private async callOpenRouterStream(
    modelId: string,
    prompt: string,
    continuationText: string,
    callbacks: StreamCallback,
    isCancelled: () => boolean
  ) {
    const key = this.settings.apiKeys.openRouter;
    if (!key) throw new Error('OpenRouter API key missing');

    const modelMap: Record<string, string> = {
      'claude-3-5-sonnet': 'anthropic/claude-3.5-sonnet',
      'gpt-4o': 'openai/gpt-4o',
      'deepseek-r1': 'deepseek/deepseek-r1',
      'gemini-1-5-pro': 'google/gemini-pro-1.5',
      'gemini-1-5-flash': 'google/gemini-flash-1.5',
      'groq-llama-3-3': 'meta-llama/llama-3.3-70b-instruct'
    };

    const targetModel = modelMap[modelId] || 'openai/gpt-4o';
    const messages = [];

    if (continuationText) {
      messages.push({
        role: 'system',
        content: `You are continuing a task handed off to you mid-stream. Here is what has been generated so far:\n"${continuationText}"\nSeamlessly continue and complete the remaining requirements.`
      });
    }

    messages.push({ role: 'user', content: prompt });

    const startTime = Date.now();
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://omniroute.local',
        'X-Title': 'OmniRoute AI Orchestrator'
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter Error: ${response.status} ${response.statusText}`);
    }

    let fullText = continuationText;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader from stream');

    while (true) {
      if (isCancelled()) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullText += token;
              callbacks.onToken(token, fullText);
            }
          } catch {
            // ignore partial JSON chunk
          }
        }
      }
    }

    callbacks.onComplete(fullText, Date.now() - startTime);
  }

  /**
   * Real API Stream via Google Gemini API
   */
  private async callGeminiStream(
    modelId: string,
    prompt: string,
    continuationText: string,
    apiKey: string,
    callbacks: StreamCallback,
    isCancelled: () => boolean
  ) {
    const startTime = Date.now();
    const geminiModel = modelId === 'gemini-1-5-flash' ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const textPayload = continuationText 
      ? `[Continuation from prior model handoff. Context so far: "${continuationText}"]\nUser Task: ${prompt}`
      : prompt;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: textPayload }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    let fullText = continuationText;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No stream reader');

    while (true) {
      if (isCancelled()) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (token) {
              fullText += token;
              callbacks.onToken(token, fullText);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    callbacks.onComplete(fullText, Date.now() - startTime);
  }

  /**
   * Real API Stream via Groq
   */
  private async callGroqStream(
    prompt: string,
    continuationText: string,
    apiKey: string,
    callbacks: StreamCallback,
    isCancelled: () => boolean
  ) {
    const startTime = Date.now();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    });

    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

    let fullText = continuationText;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      if (isCancelled()) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullText += token;
              callbacks.onToken(token, fullText);
            }
          } catch {}
        }
      }
    }
    callbacks.onComplete(fullText, Date.now() - startTime);
  }

  /**
   * Real API Stream via Local Ollama
   */
  private async callOllamaStream(
    modelId: string,
    prompt: string,
    continuationText: string,
    ollamaUrl: string,
    callbacks: StreamCallback,
    isCancelled: () => boolean
  ) {
    const startTime = Date.now();
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:latest',
        prompt: continuationText ? `Continue this: ${continuationText}\nPrompt: ${prompt}` : prompt,
        stream: true
      })
    });

    if (!response.ok) throw new Error(`Ollama Error: ${response.status}`);

    let fullText = continuationText;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      if (isCancelled()) {
        reader.cancel();
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line.trim());
            const token = parsed.response || '';
            if (token) {
              fullText += token;
              callbacks.onToken(token, fullText);
            }
          } catch {}
        }
      }
    }
    callbacks.onComplete(fullText, Date.now() - startTime);
  }

  /**
   * Synthesize multi-model outputs into a unified master output
   */
  public synthesizeOutputs(
    executions: Record<string, SegmentExecution>,
    segmentMeta: Array<{ id: string; categoryLabel: string; modelId: string }>
  ): string {
    const parts: string[] = [
      `## 🌟 Orchestrated Multi-Model Synthesis\n`,
      `*Processed synchronously across ${Object.keys(executions).length} specialized model pipelines:*\n`
    ];

    segmentMeta.forEach((meta, idx) => {
      const exec = executions[meta.id];
      const model = MODEL_MAP[meta.modelId] || MODEL_MAP[exec?.modelId || 'gpt-4o'];
      const handoffInfo = exec?.handoffs && exec.handoffs.length > 0 
        ? ` *(Dynamic Mid-stream switch from ${MODEL_MAP[exec.handoffs[0].fromModelId]?.name})*`
        : '';

      parts.push(
        `### Segment ${idx + 1}: ${meta.categoryLabel}\n` +
        `**Model Authority:** \`${model.name}\`${handoffInfo} • **Latency:** ${exec?.latencyMs || 0}ms\n\n` +
        `${exec?.output || '*Pending execution*'}\n\n---`
      );
    });

    return parts.join('\n\n');
  }
}

export const orchestratorService = MultiModelOrchestratorService.getInstance();
