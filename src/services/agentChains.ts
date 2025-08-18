/**
 * Predefined Agent Chains
 * Common workflows for document processing, Q&A, and content generation
 */

import { AgentOrchestrator, AgentChain, AgentStep, AgentConfig, WorkflowConfig } from './agentOrchestrator';

export class AgentChainFactory {
  static createDocumentProcessingChain(): AgentChain {
    return {
      id: 'document_processing',
      name: 'Document Processing Pipeline',
      description: 'Multi-step document processing with validation and enrichment',
      steps: [
        {
          id: 'validate_input',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'format',
                rule: 'document',
                errorMessage: 'Input must be a valid document',
              },
            ],
          },
          dependencies: [],
          timeout: 5000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Validate input document format',
        },
        {
          id: 'extract_content',
          agentType: 'tool',
          config: {
            tools: ['document_extractor'],
            prompt: 'Extract text content from the document',
          },
          dependencies: ['validate_input'],
          timeout: 10000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: 'Extract text content from document',
        },
        {
          id: 'analyze_content',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1000,
            prompt: 'Analyze the following document content and extract key topics, entities, and insights: {extract_content}',
          },
          dependencies: ['extract_content'],
          timeout: 15000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Analyze document content',
        },
        {
          id: 'enrich_metadata',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 500,
            prompt: 'Based on the analysis, generate rich metadata including categories, tags, and summary: {analyze_content}',
          },
          dependencies: ['analyze_content'],
          timeout: 10000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Generate enriched metadata',
        },
        {
          id: 'store_document',
          agentType: 'tool',
          config: {
            tools: ['vector_store'],
            prompt: 'Store the processed document with metadata',
          },
          dependencies: ['enrich_metadata'],
          timeout: 8000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: 'Store document in vector database',
        },
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 60000,
        maxConcurrency: 1,
      },
    } as AgentChain;
  }

  static createQASearchChain(): AgentChain {
    return {
      id: 'qa_search',
      name: 'Q&A Search Pipeline',
      description: 'Intelligent question answering with context retrieval and validation',
      steps: [
        {
          id: 'parse_question',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.1,
            maxTokens: 300,
            prompt: 'Parse and understand the user question: {input}. Extract key entities, intent, and required information.',
          },
          dependencies: [],
          timeout: 8000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Parse and understand user question',
        },
        {
          id: 'retrieve_context',
          agentType: 'tool',
          config: {
            tools: ['vector_search'],
            prompt: 'Search for relevant documents using the parsed question',
          },
          dependencies: ['parse_question'],
          timeout: 12000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: 'Retrieve relevant context',
        },
        {
          id: 'validate_context',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'content',
                rule: 'relevance_threshold',
                errorMessage: 'Insufficient relevant context found',
              },
            ],
          },
          dependencies: ['retrieve_context'],
          timeout: 5000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Validate context relevance',
        },
        {
          id: 'generate_answer',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1500,
            prompt: 'Based on the retrieved context, answer the user question: {parse_question}. Context: {retrieve_context}',
          },
          dependencies: ['validate_context'],
          timeout: 15000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Generate comprehensive answer',
        },
        {
          id: 'validate_answer',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'content',
                rule: 'answer_quality',
                errorMessage: 'Generated answer does not meet quality standards',
              },
            ],
          },
          dependencies: ['generate_answer'],
          timeout: 5000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Validate answer quality',
        },
        {
          id: 'format_response',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 800,
            prompt: 'Format the answer for user presentation: {generate_answer}. Include sources and confidence level.',
          },
          dependencies: ['validate_answer'],
          timeout: 8000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Format final response',
        },
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 60000,
        maxConcurrency: 1,
      },
    } as AgentChain;
  }

  static createContentGenerationChain(): AgentChain {
    return {
      id: 'content_generation',
      name: 'Content Generation Pipeline',
      description: 'Multi-step content generation with research, writing, and review',
      steps: [
        {
          id: 'research_topic',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1000,
            prompt: 'Research the topic: {input}. Identify key points, sources, and structure.',
          },
          dependencies: [],
          timeout: 15000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Research the topic thoroughly',
        },
        {
          id: 'outline_content',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 800,
            prompt: 'Create a detailed outline based on research: {research_topic}',
          },
          dependencies: ['research_topic'],
          timeout: 10000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Create content outline',
        },
        {
          id: 'write_content',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.4,
            maxTokens: 2000,
            prompt: 'Write comprehensive content based on the outline: {outline_content}. Research: {research_topic}',
          },
          dependencies: ['outline_content'],
          timeout: 20000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Write the main content',
        },
        {
          id: 'review_content',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.1,
            maxTokens: 1000,
            prompt: 'Review the content for accuracy, clarity, and completeness: {write_content}',
          },
          dependencies: ['write_content'],
          timeout: 12000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Review and improve content',
        },
        {
          id: 'finalize_content',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 1500,
            prompt: 'Finalize the content incorporating review feedback: {write_content}. Review: {review_content}',
          },
          dependencies: ['review_content'],
          timeout: 15000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Finalize content with improvements',
        },
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'continue',
        auditTrail: true,
        timeout: 90000,
        maxConcurrency: 1,
      },
    } as AgentChain;
  }

  static createDataAnalysisChain(): AgentChain {
    return {
      id: 'data_analysis',
      name: 'Data Analysis Pipeline',
      description: 'Comprehensive data analysis with preprocessing, analysis, and visualization',
      steps: [
        {
          id: 'validate_data',
          agentType: 'validation',
          config: {
            validationRules: [
              {
                type: 'format',
                rule: 'data_format',
                errorMessage: 'Data format is not supported',
              },
            ],
          },
          dependencies: [],
          timeout: 5000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Validate input data format',
        },
        {
          id: 'preprocess_data',
          agentType: 'tool',
          config: {
            tools: ['data_cleaner'],
            prompt: 'Clean and preprocess the input data',
          },
          dependencies: ['validate_data'],
          timeout: 15000,
          retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 10000 },
          description: 'Preprocess and clean data',
        },
        {
          id: 'analyze_patterns',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.2,
            maxTokens: 1200,
            prompt: 'Analyze patterns and insights in the preprocessed data: {preprocess_data}',
          },
          dependencies: ['preprocess_data'],
          timeout: 18000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Analyze data patterns',
        },
        {
          id: 'generate_insights',
          agentType: 'llm',
          config: {
            model: 'gpt-4',
            temperature: 0.3,
            maxTokens: 1000,
            prompt: 'Generate actionable insights from the analysis: {analyze_patterns}',
          },
          dependencies: ['analyze_patterns'],
          timeout: 12000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Generate actionable insights',
        },
        {
          id: 'create_visualization',
          agentType: 'tool',
          config: {
            tools: ['chart_generator'],
            prompt: 'Create visualizations for the analysis results',
          },
          dependencies: ['generate_insights'],
          timeout: 10000,
          retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
          description: 'Create data visualizations',
        },
      ],
      workflow: {
        parallelExecution: false,
        errorHandling: 'stop',
        auditTrail: true,
        timeout: 75000,
        maxConcurrency: 1,
      },
    } as AgentChain;
  }

  // Initialize all predefined chains
  static initializeChains(orchestrator: AgentOrchestrator): void {
    const chains = [
      this.createDocumentProcessingChain(),
      this.createQASearchChain(),
      this.createContentGenerationChain(),
      this.createDataAnalysisChain(),
    ];

    chains.forEach(chain => {
      orchestrator.createChain(chain);
    });

    console.log(`🔗 Initialized ${chains.length} predefined agent chains`);
  }
} 