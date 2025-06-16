import { env } from 'process';

export type LLMProvider = 'anthropic' | 'openai' | 'deepseek' | 'gemini' | 'local';

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

// Task-specific configurations
const configs: Record<string, LLMConfig> = {
  // Fast development tasks (code completion, simple queries)
  development: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1000,
    temperature: 0.7
  },
  
  // Complex code analysis
  analysis: {
    provider: 'openai',
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.3
  },
  
  // Quick responses (documentation, simple explanations)
  quick: {
    provider: 'gemini',
    model: 'gemini-pro',
    maxTokens: 500,
    temperature: 0.5
  },
  
  // Local development (if available)
  local: {
    provider: 'local',
    model: 'Qwen/Qwen2.5-32B-Instruct-AWQ',
    maxTokens: 1000,
    temperature: 0.7
  }
};

// Environment-based configuration
export function getLLMConfig(task: keyof typeof configs = 'development'): LLMConfig {
  // Use local model if available and enabled
  if (env.USE_LOCAL_LLM === 'true' && task !== 'analysis') {
    return configs.local;
  }
  
  // Use development config in development environment
  if (env.NODE_ENV === 'development' && task !== 'analysis') {
    return configs.development;
  }
  
  return configs[task];
}

// Helper to check if a provider is available
export function isProviderAvailable(provider: LLMProvider): boolean {
  switch (provider) {
    case 'anthropic':
      return !!env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!env.OPENAI_API_KEY;
    case 'deepseek':
      return !!env.DEEPSEEK_API_KEY;
    case 'gemini':
      return !!env.GOOGLE_API_KEY;
    case 'local':
      return env.USE_LOCAL_LLM === 'true';
    default:
      return false;
  }
}

// Get the best available provider
export function getBestAvailableProvider(): LLMConfig {
  const providers: LLMProvider[] = ['anthropic', 'openai', 'gemini', 'local', 'deepseek'];
  
  for (const provider of providers) {
    if (isProviderAvailable(provider)) {
      return configs[provider === 'local' ? 'local' : 'development'];
    }
  }
  
  throw new Error('No LLM provider available. Please configure at least one provider.');
} 