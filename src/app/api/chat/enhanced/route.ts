import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Try to import EnhancedDocumentTools
let EnhancedDocumentTools: any = null;
try {
  const module = require('@/mcp/tools/enhancedDocumentTools');
  EnhancedDocumentTools = module.EnhancedDocumentTools || module.default;
  console.log('✅ EnhancedDocumentTools imported successfully');
} catch (error) {
  console.error('❌ Failed to import EnhancedDocumentTools:', error);
}

// Ensure this route runs in Node.js
export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      streaming = false,
      useExternalAI = true,
      skipLocalContext: initialSkipLocalContext = false,
      userId = 'default'
    } = await request.json();

    let localContext = '';

    // Step 1: Fetch relevant documents unless explicitly skipped
    if (!initialSkipLocalContext && EnhancedDocumentTools) {
      try {
        const docs = await new EnhancedDocumentTools().queryDocuments({
          query: message,
          userId
        });

        if (docs.documents.length > 0) {
          localContext = docs.documents.join("\n\n");
          console.log("📄 Injecting document context:", docs.documents.length, "chunks");
        } else {
          console.log("ℹ️ No relevant document context found, falling back to general AI.");
        }
      } catch (error) {
        console.error("❌ Error fetching document context:", error);
      }
    } else if (initialSkipLocalContext) {
      console.log("🔍 Explicitly skipping local context.");
    }

    const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

    // Step 2: Greeting handler
    const q = (message || '').toLowerCase();
    const isGreeting = /^(hi|hello|hey|good\s(morning|afternoon|evening))\b/.test(q);
    if (isGreeting) {
      return NextResponse.json({
        response: 'Hello! How can I help you today?',
        responseType: 'conversational',
        hasLocalContext: !!localContext
      });
    }

    // Step 3: System prompt (static)
    const systemPrompt = `
You are a helpful AI assistant.
Instructions:
1. If document context is provided, ALWAYS use it to answer the user's question.
2. If no context is provided, answer from general knowledge.
3. Never say "I don't have access to the file". Instead, summarize from context or say you don't know.
4. Plain text only — no markdown.
    `;

    // Step 4: Build user prompt with inline context
    const userPrompt = localContext && localContext.trim().length > 0
      ? `User question: ${message}\n\nHere is the relevant document context:\n${localContext}`
      : message;

    // Step 5: Streaming response
    if (streaming && useExternalAI) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (provider === 'openai') {
              const aiStream = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                stream: true,
                max_tokens: 1000
              });

              for await (const chunk of aiStream) {
                const delta = chunk.choices?.[0]?.delta?.content || '';
                if (delta) controller.enqueue(encoder.encode(delta));
              }
            } else {
              const aiStream = await anthropic.messages.create({
                model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [
                  { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
                ],
                stream: true,
              });

              for await (const chunk of aiStream) {
                if ((chunk as any).type === 'content_block_delta' &&
                    (chunk as any).delta?.type === 'text_delta') {
                  controller.enqueue(encoder.encode((chunk as any).delta.text));
                }
              }
            }
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Step 6: Non-streaming request
    if (useExternalAI) {
      try {
        if (provider === 'openai') {
          const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 1000
          });

          const text = response.choices?.[0]?.message?.content || '';
          return NextResponse.json({
            response: text,
            responseType: 'ai_response',
            hasLocalContext: !!localContext,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
          });
        } else {
          const response = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
            max_tokens: 1000,
            messages: [
              { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
            ],
          });

          return NextResponse.json({
            response: (response as any).content?.[0]?.text || '',
            responseType: 'ai_response',
            hasLocalContext: !!localContext,
            model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
          });
        }
      } catch (error: any) {
        console.error('External AI error:', error?.message || error);

        // Fallback: return summary of local context if available
        if (localContext) {
          const plain = localContext.replace(/\n+/g, '\n').slice(0, 2000);
          return NextResponse.json({
            response: `Based on your documents:\n\n${plain.substring(0, 600)}...`,
            responseType: 'document_only',
            hasLocalContext: true
          });
        }

        return NextResponse.json({
          response: "I couldn't process your request right now. Please try again later.",
          responseType: 'error',
          hasLocalContext: false
        });
      }
    }

    // Step 7: Final fallback (no external AI used)
    return NextResponse.json({
      response: localContext
        ? `Based on your documents:\n\n${localContext.substring(0, 600)}...`
        : "I don't have any relevant information right now.",
      responseType: localContext ? 'document_only' : 'error',
      hasLocalContext: !!localContext
    });

  } catch (error) {
    console.error('Enhanced chat API error:', error);
    return NextResponse.json({
      response: "Sorry, I encountered an error. Please try again.",
      responseType: 'error'
    }, { status: 500 });
  }
}
