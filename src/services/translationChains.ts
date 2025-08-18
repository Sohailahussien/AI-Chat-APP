/**
 * Translation Agent Chains
 * Predefined chains for document translation workflows
 */

import { AgentOrchestrator, AgentStep, AgentChain, AgentConfig, RetryPolicy } from './agentOrchestrator';

export class TranslationChains {
  private orchestrator: AgentOrchestrator;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  /**
   * Create a simple translation chain
   */
  createSimpleTranslationChain(targetLanguage: string): AgentChain {
    const chain: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `Simple Translation to ${targetLanguage}`,
      description: `Translates document content to ${targetLanguage}`,
      steps: [
        {
          id: 'content_extraction',
          agentType: 'tool',
          config: {
            tools: ['document_processor'],
            prompt: 'Extract all text content from the document'
          },
          dependencies: [],
          timeout: 30000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Extract document content'
        },
        {
          id: 'translation_step',
          agentType: 'translation',
          config: {
            prompt: `translate to ${targetLanguage}`,
            tools: ['preserve_formatting']
          },
          dependencies: ['content_extraction'],
          timeout: 60000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: `Translate content to ${targetLanguage}`
        },
        {
          id: 'quality_check',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'content',
                rule: 'translated_text_length > 0',
                errorMessage: 'Translation produced empty result'
              }
            ]
          },
          dependencies: ['translation_step'],
          timeout: 15000,
          retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 3000 },
          description: 'Validate translation quality'
        }
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 120000,
        maxConcurrency: 1
      }
    };

    return this.orchestrator.createChain(chain);
  }

  /**
   * Create an advanced translation chain with multiple steps
   */
  createAdvancedTranslationChain(targetLanguage: string): AgentChain {
    const chain: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `Advanced Translation to ${targetLanguage}`,
      description: `Advanced translation workflow with content analysis and quality checks`,
      steps: [
        {
          id: 'content_analysis',
          agentType: 'llm',
          config: {
            prompt: 'Analyze the document content and identify key topics, technical terms, and cultural references that may need special attention during translation.',
            model: 'gpt-4',
            temperature: 0.3
          },
          dependencies: [],
          timeout: 30000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Analyze document content for translation considerations'
        },
        {
          id: 'content_extraction',
          agentType: 'tool',
          config: {
            tools: ['document_processor'],
            prompt: 'Extract all text content from the document, preserving structure and formatting'
          },
          dependencies: [],
          timeout: 30000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Extract document content with formatting'
        },
        {
          id: 'translation_step',
          agentType: 'translation',
          config: {
            prompt: `translate to ${targetLanguage} with high accuracy and preserve technical terms`,
            tools: ['preserve_formatting', 'technical_terms']
          },
          dependencies: ['content_extraction', 'content_analysis'],
          timeout: 90000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: `Translate content to ${targetLanguage} with context awareness`
        },
        {
          id: 'quality_validation',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'content',
                rule: 'translated_text_length > 0',
                errorMessage: 'Translation produced empty result'
              },
              {
                type: 'format',
                rule: 'preserves_original_structure',
                errorMessage: 'Translation lost original document structure'
              }
            ]
          },
          dependencies: ['translation_step'],
          timeout: 15000,
          retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 3000 },
          description: 'Validate translation quality and structure'
        },
        {
          id: 'final_review',
          agentType: 'llm',
          config: {
            prompt: `Review the translation to ${targetLanguage} and ensure it maintains the original meaning, tone, and technical accuracy. Provide a summary of any issues or improvements needed.`,
            model: 'gpt-4',
            temperature: 0.2
          },
          dependencies: ['translation_step', 'quality_validation'],
          timeout: 30000,
          retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 3000 },
          description: 'Final review of translation quality'
        }
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 300000, // 5 minutes
        maxConcurrency: 1
      }
    };

    return this.orchestrator.createChain(chain);
  }

  /**
   * Create a batch translation chain for multiple languages
   */
  createBatchTranslationChain(targetLanguages: string[]): AgentChain {
    const steps: AgentStep[] = [
      {
        id: 'content_extraction',
        agentType: 'tool',
        config: {
          tools: ['document_processor'],
          prompt: 'Extract all text content from the document'
        },
        dependencies: [],
        timeout: 30000,
        retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
        description: 'Extract document content'
      }
    ];

    // Add translation step for each target language
    targetLanguages.forEach((language, index) => {
      steps.push({
        id: `translation_${language}`,
        agentType: 'translation',
        config: {
          prompt: `translate to ${language}`,
          tools: ['preserve_formatting']
        },
        dependencies: ['content_extraction'],
        timeout: 60000,
        retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
        description: `Translate content to ${language}`
      });
    });

    const chain: Omit<AgentChain, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `Batch Translation to ${targetLanguages.join(', ')}`,
      description: `Translates document content to multiple languages: ${targetLanguages.join(', ')}`,
      steps,
      workflow: {
        parallelExecution: true,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 300000, // 5 minutes
        maxConcurrency: targetLanguages.length
      }
    };

    return this.orchestrator.createChain(chain);
  }

  /**
   * Get available translation chains
   */
  getAvailableChains(): { name: string; description: string; targetLanguages: string[] }[] {
    return [
      {
        name: 'Simple Translation',
        description: 'Basic document translation with quality validation',
        targetLanguages: ['spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'arabic', 'russian']
      },
      {
        name: 'Advanced Translation',
        description: 'Advanced translation with content analysis and detailed review',
        targetLanguages: ['spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'arabic', 'russian']
      },
      {
        name: 'Batch Translation',
        description: 'Translate to multiple languages simultaneously',
        targetLanguages: ['spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'arabic', 'russian']
      }
    ];
  }

  /**
   * Execute translation chain
   */
  async executeTranslation(
    content: string,
    targetLanguage: string,
    chainType: 'simple' | 'advanced' | 'batch' = 'simple'
  ): Promise<any> {
    let chain: AgentChain;

    switch (chainType) {
      case 'simple':
        chain = this.createSimpleTranslationChain(targetLanguage);
        break;
      case 'advanced':
        chain = this.createAdvancedTranslationChain(targetLanguage);
        break;
      case 'batch':
        chain = this.createBatchTranslationChain([targetLanguage]);
        break;
      default:
        throw new Error(`Unknown chain type: ${chainType}`);
    }

    console.log(`🚀 Executing ${chainType} translation chain to ${targetLanguage}`);
    
    const result = await this.orchestrator.executeChain(chain.id, content, {
      timeout: 300000, // 5 minutes
      variables: new Map([
        ['targetLanguage', targetLanguage],
        ['chainType', chainType]
      ])
    });

    return result;
  }
}

// Export singleton instance
export const translationChains = new TranslationChains(new AgentOrchestrator()); 