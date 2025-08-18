import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // Get user token from headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // If the query is conversational/generic, skip RAG entirely
    const text = String(message || '').trim().toLowerCase();
    const tokenCount = text.split(/\s+/).filter(Boolean).length;
    const genericPhrases = new Set([
      'general', 'general topics', 'help', 'info', 'information',
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    ]);
    if (genericPhrases.has(text) || tokenCount <= 2) {
      try {
        const aiRes = await fetch(`${request.nextUrl.origin}/api/chat/enhanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, streaming: false, useExternalAI: true, skipLocalContext: true }),
        });
        if (aiRes.ok) {
          const ai = await aiRes.json();
          return NextResponse.json(ai);
        }
      } catch {}
      return NextResponse.json({
        response: 'How can I help you? Ask me anything — general topics are fine.',
        responseType: 'conversational',
        documents: [],
        metadatas: [],
      });
    }

    // Handle regular document queries
    let rag: any = { documents: [], metadatas: [], distances: [] };
    console.log('Environment variables:', {
      PY_RAG_BASE_URL: process.env.PY_RAG_BASE_URL,
      RAG_MIN_Z: process.env.RAG_MIN_Z,
      RAG_MIN_OVERLAP: process.env.RAG_MIN_OVERLAP,
      RAG_MIN_OVERLAP_TERMS: process.env.RAG_MIN_OVERLAP_TERMS
    });
    try {
      console.log('Calling RAG service with query:', message);
      console.log('RAG URL:', `${process.env.PY_RAG_BASE_URL}/query`);
      const ragRes = await fetch(`${process.env.PY_RAG_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, top_k: 5 }),
      });
      if (ragRes.ok) {
        rag = await ragRes.json();
        console.log('RAG response:', JSON.stringify(rag, null, 2));
      } else {
        console.log('RAG service returned error:', ragRes.status, await ragRes.text());
      }
    } catch (error) {
      console.log('RAG service unavailable, error:', error);
    }

    // Determine relevance robustly (score + lexical overlap)
    const scores: number[] = Array.isArray(rag?.distances)
      ? rag.distances.map((v: any) => Number(v)).filter((v: any) => Number.isFinite(v))
      : [];
    const topScore = scores.length ? scores[0] : -Infinity;
    const mean = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const variance = scores.length ? (scores.reduce((a, b) => a + (b - mean) * (b - mean), 0) / scores.length) : 0;
    const std = Math.sqrt(variance);
    const z = std > 0 ? (topScore - mean) / std : (scores.length === 1 ? 1.0 : -Infinity);
    const minZ = Number(process.env.RAG_MIN_Z ?? '1.0');

    const docText: string = Array.isArray(rag?.documents) && rag.documents.length ? String(rag.documents[0]) : '';
    const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = (t: string) => normalize(t).split(/\s+/).filter(w => w.length > 2);
    const qTokens = new Set(tokens(message || ''));
    const dTokensArr = tokens(docText);
    const dTokens = new Set(dTokensArr);
    let overlap = 0;
    for (const w of qTokens) { if (dTokens.has(w)) overlap++; }
    const overlapRatio = qTokens.size ? overlap / qTokens.size : 0;
    const minOverlap = Number(process.env.RAG_MIN_OVERLAP ?? '0.08');

    const minOverlapTerms = Number(process.env.RAG_MIN_OVERLAP_TERMS ?? '2');
    const isRelevant = (
      Array.isArray(rag?.documents) && rag.documents.length > 0 &&
      z >= minZ &&
      overlapRatio >= minOverlap &&
      overlap >= minOverlapTerms
    );

        if (isRelevant) {
      // Generate a proper AI response using the RAG results
      const contextPrompt = `IMPORTANT: You must ONLY use the document content provided below to answer the user's question. Do NOT use any external knowledge about dragons or other topics.

User Question: "${message}"

Document Content (use ONLY this content):
${docText}

Based on the above document content ONLY, please provide a response in this EXACT format and style:

📜 Summary of [Document Name]
[Clear, concise summary of the main content with key points - use ONLY the document content above]

[If the user asks for recommendations, include this section:]
📚 Recommended Resources on [Topic]
🔹 Books
[3-4 specific book recommendations with authors - related to the document content]

🔹 Online Articles & Encyclopedias
[3-4 specific online resources - related to the document content]

🔹 Videos & Documentaries
[2-3 specific video/documentary recommendations - related to the document content]

🔹 Academic Resources
[2-3 academic sources or research areas - related to the document content]

✨ [Optional: Offer additional help or specific services]

CRITICAL: Your response must be based ONLY on the document content provided above. Do not reference dragons, mythology, or any other topics unless they are specifically mentioned in the document content.`;

      let ragResponse: any;
      try {
        // Call the enhanced AI with the RAG context
        const baseUrl = process.env.NEXTAUTH_URL
          || process.env.NEXT_PUBLIC_BASE_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        
        const aiRes = await fetch(`${baseUrl}/api/chat/enhanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: contextPrompt, 
            streaming: false, 
            useExternalAI: true, 
            skipLocalContext: false 
          }),
          cache: 'no-store',
        });
        
        if (aiRes.ok) {
          const ai = await aiRes.json();
          ragResponse = {
            response: ai.response || `Based on the document, I found relevant information: ${docText.slice(0, 300)}...`,
            responseType: 'document_query',
            documents: rag.documents || [],
            metadatas: rag.metadatas || [],
            score: topScore,
            z,
            overlap: overlapRatio,
            hasLocalContext: true,
            model: ai.model || 'gpt-4o-mini'
          };
        } else {
          // Fallback if AI call fails
          ragResponse = {
            response: `Based on the document, I found relevant information: ${docText.slice(0, 300)}...`,
            responseType: 'document_query',
            documents: rag.documents || [],
            metadatas: rag.metadatas || [],
            score: topScore,
            z,
            overlap: overlapRatio,
            hasLocalContext: true,
            model: 'gpt-4o-mini'
          };
        }
      } catch (error) {
        console.error('Error generating AI response with RAG context:', error);
        // Fallback if AI call fails
        ragResponse = {
          response: `Based on the document, I found relevant information: ${docText.slice(0, 300)}...`,
          responseType: 'document_query',
          documents: rag.documents || [],
          metadatas: rag.metadatas || [],
          score: topScore,
          z,
          overlap: overlapRatio,
          hasLocalContext: true,
          model: 'gpt-4o-mini'
        };
      }

      // Save messages to database if user is authenticated
      if (userId) {
        try {
          // Save user message
          await prisma.message.create({
            data: {
              userId,
              content: message,
              role: 'user',
              aiAgent: 'rag',
              metadata: {},
              timestamp: new Date()
            }
          });

          // Save AI response
          await prisma.message.create({
            data: {
              userId,
              content: ragResponse.response,
              role: 'assistant',
              aiAgent: 'rag',
              metadata: {
                responseType: ragResponse.responseType,
                documents: ragResponse.documents.length,
                metadatas: ragResponse.metadatas.length,
                score: ragResponse.score,
                z: ragResponse.z,
                overlap: ragResponse.overlap
              },
              timestamp: new Date()
            }
          });
        } catch (error) {
          console.error('Error saving RAG messages:', error);
          // Continue even if saving fails
        }
      }

      return NextResponse.json(ragResponse);
    }

    // Otherwise, fall back to general conversation via enhanced route (OpenAI/Anthropic)
    try {
      // Build absolute URL to avoid relative fetch issues in server runtime
      const baseUrl = process.env.NEXTAUTH_URL
        || process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const aiRes = await fetch(`${baseUrl}/api/chat/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Force general conversation: skip any local context
        body: JSON.stringify({ message, streaming: false, useExternalAI: true, skipLocalContext: true }),
        cache: 'no-store',
      });
      if (aiRes.ok) {
        const ai = await aiRes.json();
        
        // Save messages to database if user is authenticated
        if (userId) {
          try {
            // Save user message
            await prisma.message.create({
              data: {
                userId,
                content: message,
                role: 'user',
                aiAgent: 'enhanced',
                metadata: {},
                timestamp: new Date()
              }
            });

            // Save AI response
            await prisma.message.create({
              data: {
                userId,
                content: ai.response || ai.ai_response || 'AI response',
                role: 'assistant',
                aiAgent: 'enhanced',
                metadata: {
                  responseType: ai.responseType || 'ai_response',
                  documents: ai.documents?.length || 0,
                  metadatas: ai.metadatas?.length || 0
                },
                timestamp: new Date()
              }
            });
          } catch (error) {
            console.error('Error saving enhanced AI messages:', error);
            // Continue even if saving fails
          }
        }
        
        return NextResponse.json(ai);
      } else {
        console.error('Enhanced chat API failed:', aiRes.status, await aiRes.text());
      }
    } catch (e) {
      console.error('Enhanced chat API error:', e);
    }

    // If external AI not available, return neutral conversational response
    const finalResponse = {
      response: 'I can help with general questions too. How can I assist you?',
      responseType: 'conversational',
      documents: [],
      metadatas: [],
    };

    // Save messages to database if user is authenticated
    if (userId) {
      try {
        // Save user message
        await prisma.message.create({
          data: {
            userId,
            content: message,
            role: 'user',
            aiAgent: 'default',
            metadata: {},
            timestamp: new Date()
          }
        });

        // Save AI response
        await prisma.message.create({
          data: {
            userId,
            content: finalResponse.response,
            role: 'assistant',
            aiAgent: 'default',
            metadata: {
              responseType: finalResponse.responseType,
              documents: finalResponse.documents.length,
              metadatas: finalResponse.metadatas.length
            },
            timestamp: new Date()
          }
        });
      } catch (error) {
        console.error('Error saving messages:', error);
        // Continue even if saving fails
      }
    }

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      response: "Sorry, I encountered an error. Please try again.",
      responseType: 'error',
      documents: [],
      metadatas: []
    }, { status: 500 });
  }
}