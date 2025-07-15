import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  console.log('API Key exists:', !!apiKey);

  return NextResponse.json({
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    apiKey: apiKey.slice(0, 8) + '...'
  });
} 