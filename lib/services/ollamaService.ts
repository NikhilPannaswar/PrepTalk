import { OllamaRequest, OllamaResponse } from '@/types/interview';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export class OllamaService {
  private model = 'phi3:mini';

  async generateText(
    prompt: string,
    temperature = 0.3,
    maxTokens = 200
  ): Promise<string> {
    try {
      const request: OllamaRequest = {
        model: this.model,
        prompt,
        stream: false,
        temperature,
        top_p: 0.9,
        top_k: 40,
      };

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw error;
    }
  }

  async streamText(
    prompt: string,
    onChunk: (chunk: string) => void,
    temperature = 0.3
  ): Promise<void> {
    try {
      const request: OllamaRequest = {
        model: this.model,
        prompt,
        stream: true,
        temperature,
      };

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
          try {
            const data: OllamaResponse = JSON.parse(lines[i]);
            if (data.response) onChunk(data.response);
          } catch (e) {
            // Ignore parse errors
          }
        }

        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error('Ollama stream error:', error);
      throw error;
    }
  }
}

export const ollamaService = new OllamaService();
