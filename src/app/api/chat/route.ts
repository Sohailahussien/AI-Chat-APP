import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to query documents via MCP
async function queryDocuments(query: string, userId: string, origin: string) {
  try {
    console.log('🔍 Querying MCP Enhanced Document Tools for relevant documents...');
    
    const mcpResponse = await fetch(`${origin}/api/mcp/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'queryDocuments',
        serverType: 'enhanced',
        params: {
          query,
          limit: 5,
          userId
        }
      }),
    });

    if (mcpResponse.ok) {
      const mcpResult = await mcpResponse.json();
      console.log('🔍 MCP Enhanced Document Tools response:', mcpResult);
      
      if (mcpResult.success && mcpResult.documents && mcpResult.documents.length > 0) {
        return {
          success: true,
          documents: mcpResult.documents,
          distances: mcpResult.distances || [],
          sources: mcpResult.sources || [],
          metadatas: mcpResult.metadatas || []
        };
      }
    }
    
    return { success: false, documents: [], distances: [], sources: [], metadatas: [] };
  } catch (error) {
    console.error('❌ Error querying MCP Enhanced Document Tools:', error);
    return { success: false, documents: [], distances: [], sources: [], metadatas: [] };
  }
}

// Helper function to query external AI
async function queryExternalAI(message: string, systemPrompt: string, origin: string, localContext: string = '', skipLocalContext: boolean = false, userId: string = 'default') {
  try {
    console.log('🤖 Querying external AI...');
    
    const aiResponse = await fetch(`${origin}/api/chat/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        systemPrompt,
        streaming: false,
        useExternalAI: true,
        skipLocalContext,
        localContext,
        userId
      }),
    });

    if (aiResponse.ok) {
      const aiResult = await aiResponse.json();
      console.log('✅ External AI response received');
      return aiResult;
    } else {
      console.log('❌ External AI request failed:', aiResponse.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error querying external AI:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId: bodyUserId } = await request.json();
    
    // Get user token from headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId = 'default';
    
    // Priority: body userId > token userId > default
    if (bodyUserId) {
      userId = bodyUserId;
    } else if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Check if this is a general/conversational question
    const text = String(message || '').trim().toLowerCase();
    const tokenCount = text.split(/\s+/).filter(Boolean).length;
    const genericPhrases = new Set([
      'general', 'general topics', 'help', 'info', 'information',
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    ]);
    
    const isGeneralQuestion = genericPhrases.has(text) || tokenCount <= 2;
    
    console.log('🎯 Orchestration decision:', {
      message: message.substring(0, 50) + '...',
      isGeneralQuestion,
      tokenCount,
      userId
    });

    // SIMPLIFIED: Let the enhanced route handle everything
    console.log('🤖 Delegating to enhanced route for AI response...');
    
    const enhancedResult = await queryExternalAI(message, "You are a helpful AI assistant.", request.nextUrl.origin, '', false, userId);
    
    let finalResponse;
    if (enhancedResult) {
      finalResponse = {
        response: enhancedResult.response,
        responseType: enhancedResult.responseType || 'ai_response',
        hasLocalContext: enhancedResult.hasLocalContext || false,
        model: enhancedResult.model || 'gpt-4',
        contextStats: enhancedResult.contextStats || { documentCount: 0, topScore: 0, totalLength: 0 }
      };
    } else {
      // Fallback
      finalResponse = {
        response: 'How can I help you? Ask me anything — general topics are fine.',
        responseType: 'conversational',
        hasLocalContext: false,
        model: 'fallback',
        contextStats: { documentCount: 0, topScore: 0, totalLength: 0 }
      };
    }

    console.log('✅ Final response generated:', {
      hasLocalContext: finalResponse.hasLocalContext,
      contextStats: finalResponse.contextStats,
      model: finalResponse.model
    });

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      response: "Sorry, I encountered an error. Please try again.",
      responseType: 'error',
      hasLocalContext: false,
      model: 'error'
    }, { status: 500 });
  }
}