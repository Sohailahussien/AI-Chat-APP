import { NextResponse } from 'next/server';
import { StreamingTextResponse, Message } from 'ai';
import { AnthropicService } from '@/services/anthropicService';

const anthropicService = new AnthropicService();

// Enable CORS
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  console.log('API Route: Received request');
  
  try {
    const { messages, context } = await req.json();
    console.log('API Route: Parsed messages:', messages);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get streaming response from Anthropic
    const stream = await anthropicService.streamText(
      latestMessage.content,
      context ? JSON.stringify(context) : undefined
    );

    // Transform the Anthropic stream into a ReadableStream of text chunks
    const textStream = new ReadableStream({
      async start(controller) {
        let lastText = '';
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              // Only send the new text that hasn't been sent before
              const newText = chunk.delta.text;
              if (newText && newText !== lastText) {
                controller.enqueue(newText);
                lastText = newText;
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.error(error);
        }
      }
    });

    // Return the stream using StreamingTextResponse
    const response = new StreamingTextResponse(textStream);
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
    
  } catch (error) {
    console.error('API Route Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please check your API keys.' },
          { status: 401, headers: corsHeaders }
        );
      }
      
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500, headers: corsHeaders }
    );
  }
} 