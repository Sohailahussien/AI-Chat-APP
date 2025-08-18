import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing RAG service connectivity...');
    console.log('Environment variables:', {
      PY_RAG_BASE_URL: process.env.PY_RAG_BASE_URL,
      RAG_MIN_Z: process.env.RAG_MIN_Z,
      RAG_MIN_OVERLAP: process.env.RAG_MIN_OVERLAP,
      RAG_MIN_OVERLAP_TERMS: process.env.RAG_MIN_OVERLAP_TERMS
    });

    // Test RAG service health
    const healthRes = await fetch(`${process.env.PY_RAG_BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('RAG health response:', health);

    // Test RAG service query
    const queryRes = await fetch(`${process.env.PY_RAG_BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "file upload testing", top_k: 3 }),
    });
    const query = await queryRes.json();
    console.log('RAG query response:', query);

    return NextResponse.json({
      success: true,
      environment: {
        PY_RAG_BASE_URL: process.env.PY_RAG_BASE_URL,
        RAG_MIN_Z: process.env.RAG_MIN_Z,
        RAG_MIN_OVERLAP: process.env.RAG_MIN_OVERLAP,
        RAG_MIN_OVERLAP_TERMS: process.env.RAG_MIN_OVERLAP_TERMS
      },
      health,
      query
    });

  } catch (error) {
    console.error('Debug RAG error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
