import { z } from 'zod';

// Base schema for document metadata
const documentMetadataSchema = z.object({
  source: z.string(),
  source_type: z.string().optional(),
  timestamp: z.date().optional(),
});

// Schema for chat messages
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date().optional(),
});

// Tool schemas
export const toolSchemas = {
  // Document processing tools
  processDocument: {
    name: 'processDocument',
    description: 'Process and analyze a document',
    parameters: z.object({
      file: z.any(), // File object
      instructions: z.object({
        query_after_processing: z.string().optional(),
      }).optional(),
    }),
  },

  addDocument: {
    name: 'addDocument',
    description: 'Add a document to the knowledge base',
    parameters: z.object({
      content: z.string(),
      metadata: documentMetadataSchema,
    }),
  },

  queryDocuments: {
    name: 'queryDocuments',
    description: 'Search and retrieve relevant documents',
    parameters: z.object({
      query: z.string(),
      limit: z.number().optional().default(5),
    }),
  },

  // Chat processing tools
  processMessage: {
    name: 'processMessage',
    description: 'Process a chat message and generate a response',
    parameters: z.object({
      message: z.string(),
      context: z.object({
        relevantDocuments: z.array(z.string()).optional(),
        previousMessages: z.array(messageSchema).optional(),
      }).optional(),
    }),
  },

  // Task management tools
  addTask: {
    name: 'addTask',
    description: 'Add a new task to the todo list',
    parameters: z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dueDate: z.date().optional(),
    }),
  },

  updateTaskStatus: {
    name: 'updateTaskStatus',
    description: 'Update the status of a task',
    parameters: z.object({
      taskId: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
    }),
  },

  // Database access tool
  databaseAccess: {
    name: 'databaseAccess',
    description: 'Access and manage ChromaDB operations',
    parameters: z.object({
      operation: z.enum(['query', 'add', 'delete', 'update']),
      data: z.any(),
      options: z.object({
        collection: z.string().optional(),
        filter: z.record(z.any()).optional(),
      }).optional(),
    }),
  },
};

// Export types for TypeScript support
export type ToolSchemas = typeof toolSchemas;
export type ToolNames = keyof ToolSchemas; 