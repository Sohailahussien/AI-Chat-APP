import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { documents, metadatas } = body;

        if (!Array.isArray(documents) || documents.length === 0) {
            return NextResponse.json(
                { error: 'Invalid documents format. Expected non-empty array.' },
                { status: 400 }
            );
        }

        // Call the Python script to add documents using RAGPipelineService
        const { stdout, stderr } = await execAsync(
            `python -c "
from src.services.ragPipelineService import RAGPipelineService;
import json, sys;
pipeline = RAGPipelineService();
documents = json.loads('${JSON.stringify(documents).replace(/'/g, "\\'")}');
metadatas = json.loads('${JSON.stringify(metadatas || []).replace(/'/g, "\\'")}');
doc_ids = pipeline.process_documents(documents, metadatas);
print(json.dumps({'success': True, 'message': f'Successfully added {len(documents)} documents', 'ids': doc_ids}))
"`
        );

        if (stderr) {
            console.error('Python script error:', stderr);
            return NextResponse.json(
                { error: 'Failed to add documents to ChromaDB' },
                { status: 500 }
            );
        }

        const result = JSON.parse(stdout);
        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in add documents route:', error);
        return NextResponse.json(
            { error: 'Failed to process document addition request' },
            { status: 500 }
        );
    }
} 