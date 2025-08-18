import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, DOCX, TXT, or MD files.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Ingest via Python RAG service (Pinecone-backed)
    let ingested = false;
    try {
      const form = new FormData();
      // Use absolute path for the RAG service
      const absolutePath = path.resolve(filePath);
      form.append('file_path', absolutePath);
      form.append('source', file.name);
      const ingestRes = await fetch(`${process.env.PY_RAG_BASE_URL}/ingest`, {
        method: 'POST',
        body: form,
      });
      ingested = ingestRes.ok;
      if (!ingested) {
        const errText = await ingestRes.text();
        console.error('RAG ingest failed:', ingestRes.status, errText);
      }
    } catch (e) {
      console.error('RAG ingest error:', e);
    }

    return NextResponse.json({
      success: true,
      message: `File "${file.name}" uploaded${ingested ? ' and ingested' : ''} successfully`,
      fileName: file.name,
      ingested,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
} 