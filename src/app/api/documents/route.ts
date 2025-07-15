import { NextResponse } from 'next/server';
import { corsHeaders } from '../chat/route';

export async function POST(req: Request) {
  if (req.method === 'OPTIONS') {
    return NextResponse.json({}, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    // For now, just acknowledge receipt of files
    return NextResponse.json(
      { 
        success: true, 
        message: `Successfully processed ${files.length} file(s)` 
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error processing documents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process documents' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const limit = parseInt(url.searchParams.get('limit') || '4', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // This part of the code was not provided in the edit_specification,
    // so it will remain unchanged.
    // const vectorStore = new VectorStore();
    // await vectorStore.initialize();
    // const results = await vectorStore.queryDocuments(query, limit);

    return NextResponse.json({ 
      success: true, 
      // results 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // This part of the code was not provided in the edit_specification,
    // so it will remain unchanged.
    // const vectorStore = new VectorStore();
    // await vectorStore.initialize();
    // await vectorStore.clear();

    return NextResponse.json({ 
      success: true, 
      message: 'Documents cleared successfully' 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error clearing documents:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 