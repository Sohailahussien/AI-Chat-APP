import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Ensure this route runs in the Node.js runtime (not Edge)
export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { message, streaming = false, useExternalAI = true, skipLocalContext = false } = await request.json();

    // Step 1: Optionally get relevant documents from local storage
    let localContext = '';
    if (!skipLocalContext) {
      try {
        const pythonProcess = spawn('python', [
          path.join(process.cwd(), 'src', 'services', 'ragPipelineService.py'),
          '--query',
          message
        ]);

        const localResult = await new Promise((resolve, reject) => {
          let stdout = '';
          let stderr = '';

          pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code === 0 && stdout.trim()) {
              try {
                const result = JSON.parse(stdout);
                resolve(result);
              } catch (error) {
                resolve({ documents: [], metadatas: [] });
              }
            } else {
              resolve({ documents: [], metadatas: [] });
            }
          });
        });

        if ((localResult as any).documents && (localResult as any).documents.length > 0) {
          localContext = `\n\nRelevant information from your documents:\n${(localResult as any).documents.join('\n\n')}`;
        }
      } catch (error) {
        console.log('Local document search failed, continuing with external AI only');
      }
    }

    const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();

    // Step 2: If streaming is requested, create streaming response
    if (streaming && useExternalAI) {
      const encoder = new TextEncoder();
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Simple system prompt without templates
            const systemPrompt = `You are a helpful AI assistant with access to both general knowledge and specific information from the user's uploaded documents. 

When answering questions:
1. Use the provided document context when relevant
2. Supplement with your general knowledge when needed
3. Be conversational and helpful
4. If the question is outside the scope of the documents, provide a helpful general response

${localContext ? 'Document Context Available: Yes' : 'Document Context Available: No'}`;

            const userPrompt = localContext 
              ? `${message}\n\n${localContext}`
              : message;

            if (provider === 'openai') {
              // OpenAI streaming
              if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY is not set');
              }
              const stream = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                stream: true,
                max_tokens: 1000
              });

              for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta?.content || '';
                if (delta) controller.enqueue(encoder.encode(delta));
              }
            } else {
              // Anthropic streaming
              const _stream = await anthropic.messages.create({
                model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                stream: true,
              });

              for await (const chunk of _stream) {
                if ((chunk as any).type === 'content_block_delta' && (chunk as any).delta?.type === 'text_delta') {
                  const text = (chunk as any).delta.text;
                  controller.enqueue(encoder.encode(text));
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

    // Step 3: Non-streaming response
    if (useExternalAI) {
      try {
        // Simple system prompt without templates
        const systemPrompt = `You are a helpful AI assistant with access to both general knowledge and specific information from the user's uploaded documents. 

When answering questions:
1. Use the provided document context when relevant
2. Supplement with your general knowledge when needed
3. Be conversational and helpful
4. If the question is outside the scope of the documents, provide a helpful general response

${localContext ? 'Document Context Available: Yes' : 'Document Context Available: No'}`;

        const userPrompt = localContext 
          ? `${message}\n\n${localContext}`
          : message;

        if (provider === 'openai') {
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
          }
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
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
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
        // Improve error visibility in dev logs
        console.error('External AI error:', error?.message || error);
        if (error?.response) {
          try {
            const body = await error.response.json();
            console.error('External AI error body:', body);
          } catch {}
        }
        // Smart local fallback without external AI
        const q = (message || '').toLowerCase();
        const isGreeting = /^(hi|hello|hey|good\s(morning|afternoon|evening))\b/.test(q);
        const wantsMore = /(elaborate|more details|tell me more|expand|summary|summarize)/.test(q);

        if (isGreeting) {
          return NextResponse.json({
            response: 'Hello! How can I help you today? You can ask about your uploaded documents or general topics.',
            responseType: 'conversational',
            hasLocalContext: !!localContext
          });
        }

        if (localContext) {
          // Create a simple summary-style response from local docs
          const plain = localContext.replace(/\n+/g, '\n').slice(0, 2000);
          const summary = wantsMore
            ? `Here is a more detailed summary based on your document:\n\n- ${plain.split('\n').filter(Boolean).slice(0, 8).join('\n- ')}`
            : `Based on your documents: ${plain.substring(0, 600)}...`;

          return NextResponse.json({
            response: summary,
            responseType: wantsMore ? 'document_summary' : 'document_only',
            hasLocalContext: true
          });
        }

        // No local context and external AI failed → gentle fallback
        return NextResponse.json({
          response: "I couldn't access external knowledge just now. You can upload a file or try again in a moment.",
          responseType: 'error',
          hasLocalContext: false
        });
      }
    }

    // Step 4: Fallback to local documents only (no external AI requested)
    const q = (message || '').toLowerCase();
    const isGreeting = /^(hi|hello|hey|good\s(morning|afternoon|evening))\b/.test(q);
    const wantsMore = /(elaborate|more details|tell me more|expand|summary|summarize)/.test(q);

    if (isGreeting) {
      return NextResponse.json({
        response: 'Hello! How can I help you today? You can ask about your uploaded documents or general topics.',
        responseType: 'conversational',
        hasLocalContext: !!localContext
      });
    }

    if (localContext) {
      const plain = localContext.replace(/\n+/g, '\n').slice(0, 2000);
      const summary = wantsMore
        ? `Here is a more detailed summary based on your document:\n\n- ${plain.split('\n').filter(Boolean).slice(0, 8).join('\n- ')}`
        : `Based on your documents: ${plain.substring(0, 600)}...`;

      return NextResponse.json({
        response: summary,
        responseType: wantsMore ? 'document_summary' : 'document_only',
        hasLocalContext: true
      });
    }

    return NextResponse.json({
      response: "I don't have any relevant information to answer your question. Please try asking something else or upload more documents.",
      responseType: 'document_only',
      hasLocalContext: false
    });

  } catch (error) {
    console.error('Enhanced chat API error:', error);
    return NextResponse.json({
      response: "Sorry, I encountered an error. Please try again.",
      responseType: 'error'
    }, { status: 500 });
  }
}
