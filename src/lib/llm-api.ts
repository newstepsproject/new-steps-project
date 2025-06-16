import { getLLMConfig, LLMProvider } from './llm-config';

interface LLMOptions {
  provider?: LLMProvider;
  task?: 'development' | 'analysis' | 'quick';
  maxTokens?: number;
  temperature?: number;
}

export async function queryLLM(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const config = getLLMConfig(options.task);
  
  const params = {
    prompt,
    maxTokens: options.maxTokens || config.maxTokens,
    temperature: options.temperature || config.temperature,
    provider: options.provider || config.provider,
    model: config.model,
  };

  // Use the appropriate provider's API
  const command = [
    'venv/bin/python3',
    './tools/llm_api.py',
    '--prompt', `"${prompt}"`,
    '--provider', params.provider,
    ...(params.maxTokens ? ['--max-tokens', params.maxTokens.toString()] : []),
    ...(params.temperature ? ['--temperature', params.temperature.toString()] : []),
  ].join(' ');

  try {
    // Execute the command and return the result
    const result = await new Promise<string>((resolve, reject) => {
      const { exec } = require('child_process');
      exec(command, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          console.error('LLM API Error:', stderr);
          reject(error);
          return;
        }
        resolve(stdout.trim());
      });
    });

    return result;
  } catch (error) {
    console.error('Failed to query LLM:', error);
    throw error;
  }
}

// Helper for quick development queries
export async function quickQuery(prompt: string): Promise<string> {
  return queryLLM(prompt, { task: 'quick' });
}

// Helper for complex code analysis
export async function analyzeCode(code: string, question: string): Promise<string> {
  const prompt = `Code:\n${code}\n\nQuestion:\n${question}`;
  return queryLLM(prompt, { task: 'analysis' });
}

// Helper for development tasks
export async function developmentQuery(prompt: string): Promise<string> {
  return queryLLM(prompt, { task: 'development' });
} 