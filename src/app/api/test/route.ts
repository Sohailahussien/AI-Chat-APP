import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('Testing API endpoint...');
    console.log('API Key exists:', !!apiKey);

    return NextResponse.json({
      success: true,
      message: 'API endpoint is working',
      hasApiKey: !!apiKey
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      status: 'POST request received',
      body 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid JSON body' 
    }, { 
      status: 400 
    });
  }
} 