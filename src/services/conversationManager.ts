// Simple Document interface to replace LangChain import
interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  context?: Document[];
  tools?: string[];
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();

  async createConversation(id: string): Promise<void> {
    this.conversations.set(id, {
      id,
      messages: [],
    });
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });
  }

  async getRecentHistory(conversationId: string, limit: number = 10): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    return conversation.messages.slice(-limit);
  }

  async updateContext(conversationId: string, context: Document[], tools: string[]): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.context = context;
    conversation.tools = tools;
  }

  async summarizeConversation(conversationId: string): Promise<string> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // For now, just return a simple summary
    return `Conversation with ${conversation.messages.length} messages`;
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const results: Conversation[] = [];
    for (const conversation of this.conversations.values()) {
      const conversationText = conversation.messages
        .map(msg => msg.content)
        .join(' ')
        .toLowerCase();
      
      if (conversationText.includes(query.toLowerCase())) {
        results.push(conversation);
      }
    }
    return results;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    return this.conversations.delete(conversationId);
  }
} 