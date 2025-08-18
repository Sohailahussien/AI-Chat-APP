import { z } from 'zod';

// Tool parameter types
const ParameterType = z.enum(['string', 'number', 'boolean', 'array', 'object']);

// Tool parameter schema
const ParameterSchema = z.object({
  name: z.string(),
  type: ParameterType,
  description: z.string(),
  required: z.boolean().default(false),
  default: z.any().optional(),
});

// Tool schema
const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  parameters: z.array(ParameterSchema),
  handler: z.function(),
  version: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type Tool = z.infer<typeof ToolSchema>;
type Parameter = z.infer<typeof ParameterSchema>;

export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  async registerTool(tool: Tool): Promise<void> {
    this.tools.set(tool.name, tool);
  }

  async executeTool(toolName: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool.handler(params);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: string): Tool[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  searchTools(query: string): Tool[] {
    const searchTerms = query.toLowerCase().split(' ');
    return this.getAllTools().filter(tool => {
      const toolText = `${tool.name} ${tool.description}`.toLowerCase();
      return searchTerms.every(term => toolText.includes(term));
    });
  }
} 