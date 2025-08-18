/**
 * Agent Roles Definition
 * Clear definition of each agent's purpose, inputs, outputs, and handoffs
 */

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  agentType: 'llm' | 'tool' | 'decision' | 'validation';
  responsibilities: string[];
  inputs: AgentInput[];
  outputs: AgentOutput[];
  handoffs: AgentHandoff[];
  dependencies: string[];
  timeout: number;
  retryPolicy: RetryPolicy;
  validationRules: ValidationRule[];
}

export interface AgentInput {
  name: string;
  type: 'string' | 'file' | 'object' | 'array' | 'number' | 'boolean';
  description: string;
  required: boolean;
  source?: string; // Which agent provides this input
  validation?: string;
}

export interface AgentOutput {
  name: string;
  type: 'string' | 'file' | 'object' | 'array' | 'number' | 'boolean';
  description: string;
  consumers?: string[]; // Which agents consume this output
  format?: string;
}

export interface AgentHandoff {
  from: string;
  to: string;
  data: string;
  condition?: string;
  description: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface ValidationRule {
  type: 'format' | 'content' | 'schema' | 'custom';
  rule: string;
  errorMessage: string;
}

/**
 * Predefined Agent Roles
 */
export const AGENT_ROLES: Record<string, AgentRole> = {
  // Document Processing Agents
  documentRetriever: {
    id: 'documentRetriever',
    name: 'Document Retriever',
    description: 'Retrieves and loads documents from various sources',
    agentType: 'tool',
    responsibilities: [
      'Load documents from file system',
      'Parse different document formats (PDF, DOCX, TXT)',
      'Extract text content',
      'Handle document metadata',
      'Validate document integrity'
    ],
    inputs: [
      {
        name: 'filePath',
        type: 'string',
        description: 'Path to the document file',
        required: true,
        validation: 'file exists'
      },
      {
        name: 'fileType',
        type: 'string',
        description: 'Type of document (pdf, docx, txt)',
        required: false,
        validation: 'enum: pdf,docx,txt'
      }
    ],
    outputs: [
      {
        name: 'documentContent',
        type: 'string',
        description: 'Extracted text content from document',
        consumers: ['documentAnalyzer', 'textProcessor']
      },
      {
        name: 'documentMetadata',
        type: 'object',
        description: 'Document metadata (size, type, creation date)',
        consumers: ['documentAnalyzer']
      }
    ],
    handoffs: [
      {
        from: 'documentRetriever',
        to: 'documentAnalyzer',
        data: 'documentContent',
        description: 'Pass extracted content to analyzer'
      }
    ],
    dependencies: [],
    timeout: 30000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'content',
        rule: 'length > 0',
        errorMessage: 'Document content cannot be empty'
      }
    ]
  },

  documentAnalyzer: {
    id: 'documentAnalyzer',
    name: 'Document Analyzer',
    description: 'Analyzes document content for structure, topics, and key information',
    agentType: 'llm',
    responsibilities: [
      'Identify document structure and sections',
      'Extract key topics and themes',
      'Detect document type and purpose',
      'Identify important entities (names, dates, numbers)',
      'Assess document complexity and readability'
    ],
    inputs: [
      {
        name: 'documentContent',
        type: 'string',
        description: 'Text content from document retriever',
        required: true,
        source: 'documentRetriever'
      },
      {
        name: 'documentMetadata',
        type: 'object',
        description: 'Document metadata',
        required: false,
        source: 'documentRetriever'
      }
    ],
    outputs: [
      {
        name: 'documentStructure',
        type: 'object',
        description: 'Document structure analysis',
        consumers: ['contentOrganizer', 'summarizer']
      },
      {
        name: 'keyTopics',
        type: 'array',
        description: 'List of key topics and themes',
        consumers: ['summarizer', 'contentOrganizer']
      },
      {
        name: 'complexityScore',
        type: 'number',
        description: 'Document complexity score (1-10)',
        consumers: ['summarizer', 'contentOrganizer']
      }
    ],
    handoffs: [
      {
        from: 'documentAnalyzer',
        to: 'summarizer',
        data: 'keyTopics',
        description: 'Pass key topics to summarizer'
      },
      {
        from: 'documentAnalyzer',
        to: 'contentOrganizer',
        data: 'documentStructure',
        description: 'Pass structure to content organizer'
      }
    ],
    dependencies: ['documentRetriever'],
    timeout: 45000,
    retryPolicy: { maxRetries: 2, backoffMs: 2000, maxBackoffMs: 15000 },
    validationRules: [
      {
        type: 'schema',
        rule: 'has keyTopics and complexityScore',
        errorMessage: 'Analysis must include key topics and complexity score'
      }
    ]
  },

  // Content Processing Agents
  textProcessor: {
    id: 'textProcessor',
    name: 'Text Processor',
    description: 'Processes and cleans text content for further analysis',
    agentType: 'tool',
    responsibilities: [
      'Clean and normalize text',
      'Remove formatting artifacts',
      'Split text into chunks',
      'Handle special characters and encoding',
      'Prepare text for vectorization'
    ],
    inputs: [
      {
        name: 'rawText',
        type: 'string',
        description: 'Raw text content to process',
        required: true,
        source: 'documentRetriever'
      },
      {
        name: 'processingOptions',
        type: 'object',
        description: 'Text processing configuration',
        required: false
      }
    ],
    outputs: [
      {
        name: 'processedText',
        type: 'string',
        description: 'Cleaned and processed text',
        consumers: ['vectorizer', 'summarizer']
      },
      {
        name: 'textChunks',
        type: 'array',
        description: 'Text split into manageable chunks',
        consumers: ['vectorizer']
      }
    ],
    handoffs: [
      {
        from: 'textProcessor',
        to: 'vectorizer',
        data: 'textChunks',
        description: 'Pass processed chunks to vectorizer'
      }
    ],
    dependencies: ['documentRetriever'],
    timeout: 15000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 5000 },
    validationRules: [
      {
        type: 'content',
        rule: 'length > 10',
        errorMessage: 'Processed text must have meaningful content'
      }
    ]
  },

  vectorizer: {
    id: 'vectorizer',
    name: 'Vectorizer',
    description: 'Converts text content into vector embeddings for similarity search',
    agentType: 'tool',
    responsibilities: [
      'Generate text embeddings',
      'Store vectors in vector database',
      'Index content for retrieval',
      'Handle embedding model selection',
      'Manage vector metadata'
    ],
    inputs: [
      {
        name: 'textChunks',
        type: 'array',
        description: 'Processed text chunks to vectorize',
        required: true,
        source: 'textProcessor'
      },
      {
        name: 'embeddingModel',
        type: 'string',
        description: 'Embedding model to use',
        required: false
      }
    ],
    outputs: [
      {
        name: 'vectorIds',
        type: 'array',
        description: 'IDs of stored vectors',
        consumers: ['retrievalAgent']
      },
      {
        name: 'embeddingMetadata',
        type: 'object',
        description: 'Metadata about the embeddings',
        consumers: ['retrievalAgent']
      }
    ],
    handoffs: [
      {
        from: 'vectorizer',
        to: 'retrievalAgent',
        data: 'vectorIds',
        description: 'Pass vector IDs to retrieval agent'
      }
    ],
    dependencies: ['textProcessor'],
    timeout: 60000,
    retryPolicy: { maxRetries: 3, backoffMs: 2000, maxBackoffMs: 20000 },
    validationRules: [
      {
        type: 'content',
        rule: 'array length > 0',
        errorMessage: 'Must generate at least one vector'
      }
    ]
  },

  // Analysis and Generation Agents
  summarizer: {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Creates concise summaries of content based on key topics and structure',
    agentType: 'llm',
    responsibilities: [
      'Generate executive summaries',
      'Create topic-based summaries',
      'Maintain key information integrity',
      'Adapt summary length to complexity',
      'Include relevant context'
    ],
    inputs: [
      {
        name: 'documentContent',
        type: 'string',
        description: 'Original document content',
        required: true,
        source: 'documentRetriever'
      },
      {
        name: 'keyTopics',
        type: 'array',
        description: 'Key topics from analyzer',
        required: false,
        source: 'documentAnalyzer'
      },
      {
        name: 'complexityScore',
        type: 'number',
        description: 'Document complexity score',
        required: false,
        source: 'documentAnalyzer'
      }
    ],
    outputs: [
      {
        name: 'summary',
        type: 'string',
        description: 'Generated summary',
        consumers: ['contentOrganizer', 'responseGenerator']
      },
      {
        name: 'summaryMetadata',
        type: 'object',
        description: 'Summary metadata (length, topics covered)',
        consumers: ['contentOrganizer']
      }
    ],
    handoffs: [
      {
        from: 'summarizer',
        to: 'responseGenerator',
        data: 'summary',
        description: 'Pass summary to response generator'
      }
    ],
    dependencies: ['documentRetriever', 'documentAnalyzer'],
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'content',
        rule: 'length between 50 and 2000',
        errorMessage: 'Summary must be between 50 and 2000 characters'
      }
    ]
  },

  contentOrganizer: {
    id: 'contentOrganizer',
    name: 'Content Organizer',
    description: 'Organizes and structures content for optimal presentation',
    agentType: 'llm',
    responsibilities: [
      'Structure content hierarchically',
      'Create logical flow and connections',
      'Organize information by relevance',
      'Create content outlines',
      'Optimize for readability'
    ],
    inputs: [
      {
        name: 'documentStructure',
        type: 'object',
        description: 'Document structure from analyzer',
        required: true,
        source: 'documentAnalyzer'
      },
      {
        name: 'keyTopics',
        type: 'array',
        description: 'Key topics from analyzer',
        required: false,
        source: 'documentAnalyzer'
      },
      {
        name: 'summary',
        type: 'string',
        description: 'Summary from summarizer',
        required: false,
        source: 'summarizer'
      }
    ],
    outputs: [
      {
        name: 'organizedContent',
        type: 'object',
        description: 'Organized content structure',
        consumers: ['responseGenerator']
      },
      {
        name: 'contentOutline',
        type: 'array',
        description: 'Content outline and hierarchy',
        consumers: ['responseGenerator']
      }
    ],
    handoffs: [
      {
        from: 'contentOrganizer',
        to: 'responseGenerator',
        data: 'organizedContent',
        description: 'Pass organized content to response generator'
      }
    ],
    dependencies: ['documentAnalyzer', 'summarizer'],
    timeout: 25000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'schema',
        rule: 'has organizedContent and contentOutline',
        errorMessage: 'Must provide both organized content and outline'
      }
    ]
  },

  // Query and Response Agents
  retrievalAgent: {
    id: 'retrievalAgent',
    name: 'Retrieval Agent',
    description: 'Retrieves relevant content based on user queries using vector similarity',
    agentType: 'tool',
    responsibilities: [
      'Process user queries',
      'Perform vector similarity search',
      'Rank and filter results',
      'Retrieve relevant content chunks',
      'Handle query expansion'
    ],
    inputs: [
      {
        name: 'userQuery',
        type: 'string',
        description: 'User query to search for',
        required: true
      },
      {
        name: 'vectorIds',
        type: 'array',
        description: 'Available vector IDs',
        required: false,
        source: 'vectorizer'
      },
      {
        name: 'searchOptions',
        type: 'object',
        description: 'Search configuration options',
        required: false
      }
    ],
    outputs: [
      {
        name: 'relevantChunks',
        type: 'array',
        description: 'Relevant content chunks',
        consumers: ['responseGenerator']
      },
      {
        name: 'relevanceScores',
        type: 'array',
        description: 'Relevance scores for chunks',
        consumers: ['responseGenerator']
      }
    ],
    handoffs: [
      {
        from: 'retrievalAgent',
        to: 'responseGenerator',
        data: 'relevantChunks',
        description: 'Pass relevant chunks to response generator'
      }
    ],
    dependencies: ['vectorizer'],
    timeout: 20000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'content',
        rule: 'array length > 0',
        errorMessage: 'Must retrieve at least one relevant chunk'
      }
    ]
  },

  responseGenerator: {
    id: 'responseGenerator',
    name: 'Response Generator',
    description: 'Generates coherent and contextual responses based on retrieved content',
    agentType: 'llm',
    responsibilities: [
      'Generate natural language responses',
      'Incorporate retrieved content',
      'Maintain conversation context',
      'Provide accurate citations',
      'Handle different response types'
    ],
    inputs: [
      {
        name: 'userQuery',
        type: 'string',
        description: 'Original user query',
        required: true
      },
      {
        name: 'relevantChunks',
        type: 'array',
        description: 'Relevant content from retrieval',
        required: false,
        source: 'retrievalAgent'
      },
      {
        name: 'summary',
        type: 'string',
        description: 'Document summary',
        required: false,
        source: 'summarizer'
      },
      {
        name: 'organizedContent',
        type: 'object',
        description: 'Organized content structure',
        required: false,
        source: 'contentOrganizer'
      }
    ],
    outputs: [
      {
        name: 'response',
        type: 'string',
        description: 'Generated response to user',
        consumers: ['responseValidator']
      },
      {
        name: 'responseMetadata',
        type: 'object',
        description: 'Response metadata (sources, confidence)',
        consumers: ['responseValidator']
      }
    ],
    handoffs: [
      {
        from: 'responseGenerator',
        to: 'responseValidator',
        data: 'response',
        description: 'Pass response to validator'
      }
    ],
    dependencies: ['retrievalAgent', 'summarizer', 'contentOrganizer'],
    timeout: 30000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'content',
        rule: 'length > 10',
        errorMessage: 'Response must have meaningful content'
      }
    ]
  },

  // Validation and Quality Agents
  responseValidator: {
    id: 'responseValidator',
    name: 'Response Validator',
    description: 'Validates response quality, accuracy, and relevance',
    agentType: 'validation',
    responsibilities: [
      'Check response accuracy',
      'Validate relevance to query',
      'Ensure completeness',
      'Check for hallucinations',
      'Verify source citations'
    ],
    inputs: [
      {
        name: 'response',
        type: 'string',
        description: 'Generated response to validate',
        required: true,
        source: 'responseGenerator'
      },
      {
        name: 'userQuery',
        type: 'string',
        description: 'Original user query',
        required: true
      },
      {
        name: 'relevantChunks',
        type: 'array',
        description: 'Source content used',
        required: false,
        source: 'retrievalAgent'
      }
    ],
    outputs: [
      {
        name: 'validationResult',
        type: 'object',
        description: 'Validation results and scores',
        consumers: ['qualityController']
      },
      {
        name: 'validationIssues',
        type: 'array',
        description: 'List of validation issues found',
        consumers: ['qualityController']
      }
    ],
    handoffs: [
      {
        from: 'responseValidator',
        to: 'qualityController',
        data: 'validationResult',
        description: 'Pass validation results to quality controller'
      }
    ],
    dependencies: ['responseGenerator'],
    timeout: 15000,
    retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
    validationRules: [
      {
        type: 'custom',
        rule: 'accuracy_score > 0.7',
        errorMessage: 'Response accuracy must be above 70%'
      }
    ]
  },

  qualityController: {
    id: 'qualityController',
    name: 'Quality Controller',
    description: 'Controls final response quality and decides on response delivery',
    agentType: 'decision',
    responsibilities: [
      'Evaluate overall response quality',
      'Decide whether to deliver or regenerate',
      'Apply quality thresholds',
      'Handle edge cases',
      'Manage response delivery'
    ],
    inputs: [
      {
        name: 'validationResult',
        type: 'object',
        description: 'Validation results from validator',
        required: true,
        source: 'responseValidator'
      },
      {
        name: 'response',
        type: 'string',
        description: 'Generated response',
        required: true,
        source: 'responseGenerator'
      },
      {
        name: 'userQuery',
        type: 'string',
        description: 'Original user query',
        required: true
      }
    ],
    outputs: [
      {
        name: 'finalResponse',
        type: 'string',
        description: 'Final response to deliver to user',
        consumers: []
      },
      {
        name: 'qualityScore',
        type: 'number',
        description: 'Overall quality score',
        consumers: []
      },
      {
        name: 'deliveryDecision',
        type: 'string',
        description: 'Decision on response delivery',
        consumers: []
      }
    ],
    handoffs: [],
    dependencies: ['responseValidator'],
    timeout: 10000,
    retryPolicy: { maxRetries: 1, backoffMs: 1000, maxBackoffMs: 5000 },
    validationRules: [
      {
        type: 'custom',
        rule: 'qualityScore >= 0.8',
        errorMessage: 'Quality score must be at least 80%'
      }
    ]
  },

  // Planning and Coordination Agents
  taskPlanner: {
    id: 'taskPlanner',
    name: 'Task Planner',
    description: 'Plans and coordinates multi-step tasks and workflows',
    agentType: 'llm',
    responsibilities: [
      'Break down complex tasks',
      'Create execution plans',
      'Identify dependencies',
      'Optimize task sequences',
      'Handle task prioritization'
    ],
    inputs: [
      {
        name: 'userRequest',
        type: 'string',
        description: 'User request or task description',
        required: true
      },
      {
        name: 'availableAgents',
        type: 'array',
        description: 'List of available agents',
        required: false
      }
    ],
    outputs: [
      {
        name: 'executionPlan',
        type: 'object',
        description: 'Detailed execution plan',
        consumers: ['workflowOrchestrator']
      },
      {
        name: 'taskSequence',
        type: 'array',
        description: 'Ordered sequence of tasks',
        consumers: ['workflowOrchestrator']
      }
    ],
    handoffs: [
      {
        from: 'taskPlanner',
        to: 'workflowOrchestrator',
        data: 'executionPlan',
        description: 'Pass execution plan to orchestrator'
      }
    ],
    dependencies: [],
    timeout: 20000,
    retryPolicy: { maxRetries: 2, backoffMs: 1000, maxBackoffMs: 10000 },
    validationRules: [
      {
        type: 'schema',
        rule: 'has executionPlan and taskSequence',
        errorMessage: 'Must provide both execution plan and task sequence'
      }
    ]
  },

  workflowOrchestrator: {
    id: 'workflowOrchestrator',
    name: 'Workflow Orchestrator',
    description: 'Orchestrates and manages the execution of multi-agent workflows',
    agentType: 'tool',
    responsibilities: [
      'Execute planned workflows',
      'Manage agent coordination',
      'Handle workflow state',
      'Monitor execution progress',
      'Handle errors and recovery'
    ],
    inputs: [
      {
        name: 'executionPlan',
        type: 'object',
        description: 'Execution plan from task planner',
        required: true,
        source: 'taskPlanner'
      },
      {
        name: 'workflowContext',
        type: 'object',
        description: 'Current workflow context',
        required: false
      }
    ],
    outputs: [
      {
        name: 'workflowResult',
        type: 'object',
        description: 'Final workflow result',
        consumers: []
      },
      {
        name: 'executionLog',
        type: 'array',
        description: 'Detailed execution log',
        consumers: []
      }
    ],
    handoffs: [],
    dependencies: ['taskPlanner'],
    timeout: 300000, // 5 minutes for complex workflows
    retryPolicy: { maxRetries: 1, backoffMs: 5000, maxBackoffMs: 30000 },
    validationRules: [
      {
        type: 'custom',
        rule: 'has workflowResult',
        errorMessage: 'Must produce a workflow result'
      }
    ]
  }
};

/**
 * Agent Role Categories
 */
export const AGENT_CATEGORIES = {
  documentProcessing: ['documentRetriever', 'documentAnalyzer'],
  contentProcessing: ['textProcessor', 'vectorizer'],
  analysisGeneration: ['summarizer', 'contentOrganizer'],
  queryResponse: ['retrievalAgent', 'responseGenerator'],
  validationQuality: ['responseValidator', 'qualityController'],
  planningCoordination: ['taskPlanner', 'workflowOrchestrator']
};

/**
 * Common Workflow Patterns
 */
export const WORKFLOW_PATTERNS = {
  documentAnalysis: [
    'documentRetriever',
    'documentAnalyzer',
    'textProcessor',
    'summarizer',
    'contentOrganizer'
  ],
  queryResponse: [
    'retrievalAgent',
    'responseGenerator',
    'responseValidator',
    'qualityController'
  ],
  fullPipeline: [
    'taskPlanner',
    'documentRetriever',
    'documentAnalyzer',
    'textProcessor',
    'vectorizer',
    'retrievalAgent',
    'responseGenerator',
    'responseValidator',
    'qualityController'
  ]
};

/**
 * Agent Role Utilities
 */
export class AgentRoleManager {
  static getRole(roleId: string): AgentRole | undefined {
    return AGENT_ROLES[roleId];
  }

  static getAllRoles(): AgentRole[] {
    return Object.values(AGENT_ROLES);
  }

  static getRolesByCategory(category: string): AgentRole[] {
    const roleIds = AGENT_CATEGORIES[category as keyof typeof AGENT_CATEGORIES] || [];
    return roleIds.map(id => AGENT_ROLES[id]).filter(Boolean);
  }

  static getWorkflowPattern(patternName: string): AgentRole[] {
    const roleIds = WORKFLOW_PATTERNS[patternName as keyof typeof WORKFLOW_PATTERNS] || [];
    return roleIds.map(id => AGENT_ROLES[id]).filter(Boolean);
  }

  static validateRoleDependencies(roles: AgentRole[]): boolean {
    const roleIds = new Set(roles.map(r => r.id));
    
    for (const role of roles) {
      for (const dependency of role.dependencies) {
        if (!roleIds.has(dependency)) {
          console.error(`Role ${role.id} depends on missing role: ${dependency}`);
          return false;
        }
      }
    }
    
    return true;
  }

  static getRoleInputs(roleId: string): AgentInput[] {
    const role = AGENT_ROLES[roleId];
    return role ? role.inputs : [];
  }

  static getRoleOutputs(roleId: string): AgentOutput[] {
    const role = AGENT_ROLES[roleId];
    return role ? role.outputs : [];
  }

  static getRoleHandoffs(roleId: string): AgentHandoff[] {
    const role = AGENT_ROLES[roleId];
    return role ? role.handoffs : [];
  }
} 