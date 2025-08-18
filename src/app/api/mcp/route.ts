import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, prompt, tool, input, config } = body;

    console.log(`🔄 MCP API: Received ${type} request`);

    switch (type) {
      case 'llm':
        // Handle LLM requests
        return NextResponse.json({
          success: true,
          data: {
            response: `LLM response to: ${prompt}`,
            type: 'llm'
          }
        });

      case 'tool':
        // Handle tool requests
        return NextResponse.json({
          success: true,
          data: {
            response: `Tool ${tool} executed with input: ${JSON.stringify(input)}`,
            type: 'tool'
          }
        });

      case 'translation':
        // Handle translation requests
        const { content, targetLanguage } = input || {};
        return NextResponse.json({
          success: true,
          data: {
            response: `Translation to ${targetLanguage}: ${content}`,
            type: 'translation'
          }
        });

      case 'analysis':
        // Handle analysis requests
        return NextResponse.json({
          success: true,
          data: {
            response: `Analysis completed for: ${JSON.stringify(input)}`,
            type: 'analysis'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown request type: ${type}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ MCP API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  if (pathname.endsWith('/health')) {
    return NextResponse.json({ status: 'healthy' });
  }
  
  if (pathname.endsWith('/tools')) {
    return NextResponse.json({
      tools: [
        'document_processor',
        'translation_agent',
        'content_analyzer',
        'text_summarizer'
      ]
    });
  }
  
  return NextResponse.json({ message: 'MCP API is running' });
} 