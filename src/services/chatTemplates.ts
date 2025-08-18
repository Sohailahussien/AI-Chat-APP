export interface ChatTemplate {
  id: string;
  name: string;
  description: string;
  category: 'knowledge' | 'conversation' | 'task' | 'custom';
  systemPrompt: string;
  examples: ConversationExample[];
  contextRules: ContextRule[];
  responsePatterns: ResponsePattern[];
  metadata: {
    tags: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    useCases: string[];
    lastUpdated: Date;
  };
}

export interface ConversationExample {
  user: string;
  assistant: string;
  context?: string;
  tags?: string[];
}

export interface ContextRule {
  type: 'include' | 'exclude' | 'modify';
  condition: string;
  action: string;
  priority: number;
}

export interface ResponsePattern {
  pattern: string;
  response: string;
  conditions?: string[];
  variables?: string[];
}

export class ChatTemplateManager {
  private templates: Map<string, ChatTemplate> = new Map();
  private activeTemplates: Set<string> = new Set();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates() {
    // Knowledge-based templates
    this.addTemplate({
      id: 'technical-support',
      name: 'Technical Support Assistant',
      description: 'Specialized in technical troubleshooting and support',
      category: 'knowledge',
      systemPrompt: `You are a technical support specialist with expertise in software, hardware, and IT systems. 
      
Your capabilities include:
- Diagnosing technical issues
- Providing step-by-step solutions
- Explaining technical concepts in simple terms
- Recommending best practices
- Troubleshooting common problems

Always be patient, clear, and thorough in your explanations.`,
      examples: [
        {
          user: "My computer is running very slowly",
          assistant: "I can help you troubleshoot your slow computer. Let's start by identifying the issue:\n\n1. **Check Task Manager** - Press Ctrl+Shift+Esc to see which programs are using the most resources\n2. **Restart your computer** - This often resolves temporary issues\n3. **Check for updates** - Ensure your system and drivers are up to date\n\nCan you tell me what you see in Task Manager under the Performance tab?",
          tags: ['troubleshooting', 'performance']
        },
        {
          user: "How do I install a new hard drive?",
          assistant: "Installing a new hard drive involves several steps. Here's a general guide:\n\n**Before starting:**\n- Back up important data\n- Gather necessary tools (screwdriver, SATA cables)\n- Ensure compatibility with your system\n\n**Installation steps:**\n1. Power down and unplug your computer\n2. Open the case and locate the drive bays\n3. Mount the drive securely\n4. Connect power and data cables\n5. Boot up and initialize the drive\n\nWould you like me to provide more specific instructions for your particular system?",
          tags: ['hardware', 'installation']
        }
      ],
      contextRules: [
        {
          type: 'include',
          condition: 'technical_issue',
          action: 'Provide diagnostic steps and troubleshooting guidance',
          priority: 1
        }
      ],
      responsePatterns: [
        {
          pattern: 'slow computer',
          response: 'Let\'s diagnose your slow computer step by step. First, check Task Manager for resource usage.',
          conditions: ['performance_issue'],
          variables: ['system_type', 'symptoms']
        }
      ],
      metadata: {
        tags: ['technical', 'support', 'troubleshooting'],
        difficulty: 'intermediate',
        useCases: ['IT support', 'Customer service', 'Technical documentation'],
        lastUpdated: new Date()
      }
    });

    // Conversation templates
    this.addTemplate({
      id: 'customer-service',
      name: 'Customer Service Representative',
      description: 'Professional customer service with empathy and problem-solving',
      category: 'conversation',
      systemPrompt: `You are a professional customer service representative. Your role is to:
- Listen actively and show empathy
- Understand customer needs and concerns
- Provide accurate information and solutions
- Maintain a positive, helpful attitude
- Escalate issues when necessary
- Follow up to ensure satisfaction

Always be polite, patient, and solution-oriented.`,
      examples: [
        {
          user: "I'm very frustrated with your service",
          assistant: "I completely understand your frustration, and I sincerely apologize for the inconvenience you've experienced. Your satisfaction is our top priority, and I'm here to help resolve this situation for you.\n\nCould you please share more details about what happened? This will help me provide the best possible solution and ensure we address all your concerns.",
          tags: ['empathy', 'de-escalation']
        },
        {
          user: "I want to cancel my subscription",
          assistant: "I understand you're considering canceling your subscription. Before we proceed, I'd like to understand what led to this decision. Sometimes we can offer solutions that might better meet your needs.\n\nCould you tell me more about what's not working for you? I'm here to help find the best solution for your situation.",
          tags: ['retention', 'problem-solving']
        }
      ],
      contextRules: [
        {
          type: 'include',
          condition: 'customer_complaint',
          action: 'Show empathy and offer solutions',
          priority: 1
        }
      ],
      responsePatterns: [
        {
          pattern: 'frustrated|angry|upset',
          response: 'I understand your frustration and I\'m here to help resolve this for you.',
          conditions: ['negative_emotion'],
          variables: ['emotion_type', 'issue_description']
        }
      ],
      metadata: {
        tags: ['customer-service', 'empathy', 'problem-solving'],
        difficulty: 'beginner',
        useCases: ['Customer support', 'Sales', 'Retail'],
        lastUpdated: new Date()
      }
    });

    // Task-oriented templates
    this.addTemplate({
      id: 'project-manager',
      name: 'Project Management Assistant',
      description: 'Helps with project planning, tracking, and management',
      category: 'task',
      systemPrompt: `You are a project management assistant with expertise in:
- Project planning and scheduling
- Task management and delegation
- Risk assessment and mitigation
- Progress tracking and reporting
- Team coordination and communication
- Resource allocation and budgeting

Provide practical, actionable advice for project management challenges.`,
      examples: [
        {
          user: "How do I create a project timeline?",
          assistant: "Creating an effective project timeline involves several key steps:\n\n**1. Define Project Scope**\n- List all deliverables and requirements\n- Identify project boundaries and constraints\n\n**2. Break Down Work**\n- Create a Work Breakdown Structure (WBS)\n- Identify all tasks and subtasks\n- Estimate effort for each task\n\n**3. Sequence Activities**\n- Determine task dependencies\n- Create a network diagram\n- Identify critical path\n\n**4. Allocate Resources**\n- Assign team members to tasks\n- Consider resource availability and skills\n\n**5. Set Milestones**\n- Define key checkpoints and deliverables\n- Set realistic deadlines\n\nWould you like me to help you create a specific timeline for your project?",
          tags: ['planning', 'timeline']
        }
      ],
      contextRules: [
        {
          type: 'include',
          condition: 'project_planning',
          action: 'Provide structured planning guidance',
          priority: 1
        }
      ],
      responsePatterns: [
        {
          pattern: 'timeline|schedule|deadline',
          response: 'Let\'s create a structured timeline for your project. First, let\'s define the scope and deliverables.',
          conditions: ['planning_phase'],
          variables: ['project_type', 'duration', 'team_size']
        }
      ],
      metadata: {
        tags: ['project-management', 'planning', 'organization'],
        difficulty: 'intermediate',
        useCases: ['Project management', 'Team leadership', 'Business planning'],
        lastUpdated: new Date()
      }
    });
  }

  addTemplate(template: ChatTemplate): void {
    this.templates.set(template.id, template);
    console.log(`Chat template "${template.name}" added successfully`);
  }

  getTemplate(id: string): ChatTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): ChatTemplate[] {
    return Array.from(this.templates.values());
  }

  activateTemplate(id: string): boolean {
    if (this.templates.has(id)) {
      this.activeTemplates.add(id);
      console.log(`Template "${id}" activated`);
      return true;
    }
    return false;
  }

  deactivateTemplate(id: string): boolean {
    return this.activeTemplates.delete(id);
  }

  getActiveTemplates(): ChatTemplate[] {
    return Array.from(this.activeTemplates).map(id => this.templates.get(id)!);
  }

  generateSystemPrompt(userQuery: string): string {
    const activeTemplates = this.getActiveTemplates();
    if (activeTemplates.length === 0) {
      return "You are a helpful AI assistant. Provide accurate, helpful responses based on the available information.";
    }

    let combinedPrompt = "You are a specialized AI assistant with expertise in multiple areas. ";
    
    // Combine system prompts from active templates
    activeTemplates.forEach(template => {
      combinedPrompt += `\n\n**${template.name}**: ${template.systemPrompt}`;
    });

    // Add context rules
    const relevantRules = this.getRelevantContextRules(userQuery);
    if (relevantRules.length > 0) {
      combinedPrompt += "\n\n**Context Rules:**";
      relevantRules.forEach(rule => {
        combinedPrompt += `\n- ${rule.action}`;
      });
    }

    return combinedPrompt;
  }

  private getRelevantContextRules(query: string): ContextRule[] {
    const activeTemplates = this.getActiveTemplates();
    const relevantRules: ContextRule[] = [];

    activeTemplates.forEach(template => {
      template.contextRules.forEach(rule => {
        if (this.matchesCondition(query, rule.condition)) {
          relevantRules.push(rule);
        }
      });
    });

    return relevantRules.sort((a, b) => b.priority - a.priority);
  }

  private matchesCondition(query: string, condition: string): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerCondition = condition.toLowerCase();
    
    // Simple keyword matching - can be enhanced with NLP
    return lowerQuery.includes(lowerCondition.replace('_', ' '));
  }

  getResponseExamples(query: string): ConversationExample[] {
    const activeTemplates = this.getActiveTemplates();
    const examples: ConversationExample[] = [];

    activeTemplates.forEach(template => {
      template.examples.forEach(example => {
        if (this.isRelevantExample(query, example)) {
          examples.push(example);
        }
      });
    });

    return examples;
  }

  private isRelevantExample(query: string, example: ConversationExample): boolean {
    const lowerQuery = query.toLowerCase();
    const lowerUser = example.user.toLowerCase();
    const lowerAssistant = example.assistant.toLowerCase();
    
    // Check if query matches example user input or assistant response
    return lowerQuery.includes(lowerUser.substring(0, 20)) || 
           lowerUser.includes(lowerQuery.substring(0, 20)) ||
           example.tags?.some(tag => lowerQuery.includes(tag.toLowerCase()));
  }

  // Training methods
  trainWithConversation(conversation: { user: string; assistant: string }[], templateId?: string): void {
    if (templateId && this.templates.has(templateId)) {
      const template = this.templates.get(templateId)!;
      conversation.forEach(({ user, assistant }) => {
        template.examples.push({
          user,
          assistant,
          tags: this.extractTags(user, assistant)
        });
      });
      console.log(`Trained template "${templateId}" with ${conversation.length} examples`);
    } else {
      // Create a new template from conversation
      const newTemplate: ChatTemplate = {
        id: `trained-${Date.now()}`,
        name: 'Trained Template',
        description: 'Template created from conversation training',
        category: 'custom',
        systemPrompt: 'You are an AI assistant trained on specific conversation patterns.',
        examples: conversation.map(({ user, assistant }) => ({
          user,
          assistant,
          tags: this.extractTags(user, assistant)
        })),
        contextRules: [],
        responsePatterns: [],
        metadata: {
          tags: ['trained', 'custom'],
          difficulty: 'beginner',
          useCases: ['Custom training'],
          lastUpdated: new Date()
        }
      };
      this.addTemplate(newTemplate);
    }
  }

  private extractTags(user: string, assistant: string): string[] {
    // Simple tag extraction - can be enhanced with NLP
    const tags: string[] = [];
    const text = `${user} ${assistant}`.toLowerCase();
    
    if (text.includes('error') || text.includes('problem')) tags.push('troubleshooting');
    if (text.includes('how') || text.includes('what')) tags.push('question');
    if (text.includes('thank')) tags.push('gratitude');
    if (text.includes('sorry') || text.includes('apologize')) tags.push('apology');
    
    return tags;
  }

  exportTemplate(id: string): string {
    const template = this.templates.get(id);
    if (!template) throw new Error(`Template ${id} not found`);
    return JSON.stringify(template, null, 2);
  }

  importTemplate(templateJson: string): void {
    try {
      const template: ChatTemplate = JSON.parse(templateJson);
      this.addTemplate(template);
    } catch (error) {
      throw new Error('Invalid template JSON format');
    }
  }
}
