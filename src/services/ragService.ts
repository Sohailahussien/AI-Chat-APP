import { VectorStore, QueryResult } from './vectorStore';
import { DocumentProcessor } from '../utils/documentProcessors';
import { ContextEnhancer } from './contextEnhancer';
import { ToolManager } from './toolManager';
import { ConversationManager } from './conversationManager';

// Simple Document interface to replace LangChain import
interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

interface RelevantDocs {
  documents: string[][];
  metadatas: Record<string, any>[][];
  similarities: number[][];
}

export class RAGService {
  private vectorStore: VectorStore;
  private documentProcessor: DocumentProcessor;
  private contextEnhancer: ContextEnhancer;
  private toolManager: ToolManager;
  private conversationManager: ConversationManager;

  constructor() {
    console.log('Initializing RAG service...');
    this.vectorStore = new VectorStore();
    this.documentProcessor = new DocumentProcessor();
    this.contextEnhancer = new ContextEnhancer();
    this.toolManager = new ToolManager();
    this.conversationManager = new ConversationManager();
    console.log('RAG service components initialized');
  }

  async initialize() {
    try {
      console.log('Starting RAG service initialization...');
      await Promise.all([
        this.vectorStore.initialize(),
        this.initializeDefaultTools()
      ]);
      console.log('RAG service initialization complete');
    } catch (error) {
      console.error('Error during RAG service initialization:', error);
      throw error;
    }
  }

  private async initializeDefaultTools() {
    // Register default tools
    await this.toolManager.registerTool({
      name: 'search_documents',
      description: 'Search through processed documents',
      category: 'retrieval',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query',
          required: true
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          required: false,
          default: 5
        }
      ],
      handler: async (params: any) => {
        return this.vectorStore.queryDocuments(params.query, params.limit);
      }
    });

    await this.toolManager.registerTool({
      name: 'process_url',
      description: 'Process and store content from a URL',
      category: 'ingestion',
      parameters: [
        {
          name: 'url',
          type: 'string',
          description: 'URL to process',
          required: true
        }
      ],
      handler: async (params: any) => {
        const documents = await this.documentProcessor.processURL(params.url);
        await this.vectorStore.addDocuments(documents);
        return { processed: true, documentCount: documents.length };
      }
    });
  }

  async addDocuments(documents: Document[]) {
    try {
      // Process documents using the document processor
      const processedDocs = await Promise.all(
        documents.map(doc => this.documentProcessor.processText(
          doc.pageContent,
          doc.metadata
        ))
      );

      // Flatten the array of document arrays
      const flattenedDocs = processedDocs.flat();

      // Store in vector store
      await this.vectorStore.addDocuments(flattenedDocs);

      return {
        success: true,
        processedCount: flattenedDocs.length,
        originalCount: documents.length
      };
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  async processQuery(
    query: string,
    conversationId?: string,
    externalContext?: Record<string, any>
  ): Promise<any> {
    try {
      console.log('Processing query:', query);
      console.log('Conversation ID:', conversationId);
      
      if (!conversationId) {
        conversationId = `conv_${Date.now()}`;
        await this.conversationManager.createConversation(conversationId);
      }

      await this.conversationManager.addMessage(conversationId, 'user', query);
      const history = await this.conversationManager.getRecentHistory(conversationId);
      console.log('Retrieved conversation history:', history);

      console.log('Querying vector store...');
      const relevantDocs = await this.vectorStore.queryDocuments(query);
      console.log('Retrieved relevant documents:', relevantDocs);

      const documents = (relevantDocs.documents?.[0] || [])
        .filter((doc: string | null): doc is string => doc !== null)
        .map((doc: string, index: number) => ({
          pageContent: doc,
          metadata: relevantDocs.metadatas?.[0]?.[index] || {}
        }));

      console.log('Enhancing context...');
      const enhancedDocs = await this.contextEnhancer.enhanceContext(
        [...documents, ...(externalContext?.documents || [])],
        query
      );

      await this.conversationManager.updateContext(
        conversationId,
        enhancedDocs,
        this.toolManager.getAllTools().map(tool => tool.name)
      );

      // Format context for API request
      const context = {
        documents: enhancedDocs.map(doc => doc.pageContent),
        metadatas: enhancedDocs.map(doc => doc.metadata),
        conversationHistory: history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        ...(externalContext || {})
      };

      // Make API request to chat endpoint
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : `http://localhost:${process.env.PORT || 3005}`;
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          context: context
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response from API');
      }

      // Return the response stream
      return {
        stream: response.body,
        conversationId
      };
    } catch (error) {
      console.error('Error processing query:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error;
    }
  }

  async registerTool(tool: any) {
    return this.toolManager.registerTool(tool);
  }

  async executeTool(toolName: string, params: Record<string, any>) {
    return this.toolManager.executeTool(toolName, params);
  }

  async getTools() {
    return this.toolManager.getAllTools();
  }

  async getToolsByCategory(category: string) {
    return this.toolManager.getToolsByCategory(category);
  }

  async searchTools(query: string) {
    return this.toolManager.searchTools(query);
  }

  // Conversation management methods
  async getConversationHistory(conversationId: string, limit?: number) {
    return this.conversationManager.getRecentHistory(conversationId, limit);
  }

  async summarizeConversation(conversationId: string) {
    return this.conversationManager.summarizeConversation(conversationId);
  }

  async searchConversations(query: string) {
    return this.conversationManager.searchConversations(query);
  }

  async deleteConversation(conversationId: string) {
    return this.conversationManager.deleteConversation(conversationId);
  }
} 