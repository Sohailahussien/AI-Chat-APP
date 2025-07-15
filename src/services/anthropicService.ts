import Anthropic from '@anthropic-ai/sdk';

export class AnthropicService {
  private client: Anthropic;

  constructor() {
    // Check if we're on the server side
    if (typeof window !== 'undefined') {
      throw new Error('AnthropicService can only be instantiated on the server side');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('Initializing Anthropic service...');
    console.log('API Key exists:', !!apiKey);

    if (!apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    try {
      this.client = new Anthropic({
        apiKey: apiKey
      });
      console.log('Anthropic client initialized successfully');
    } catch (error) {
      console.error('Error initializing Anthropic client:', error);
      throw error;
    }
  }

  async streamText(
    prompt: string,
    context?: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ) {
    const messages = [{
      role: 'user' as const,
      content: prompt
    }];

    return this.client.messages.stream({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      messages: messages,
      system: context ? `Context information: ${context}` : undefined,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000
    });
  }
} 