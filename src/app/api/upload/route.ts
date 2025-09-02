import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('📤 Upload request received');
    
    // Get user token from headers
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let userId = null;

    if (token) {
      const decoded = verifyJWT(token);
      if (decoded) {
        userId = decoded.userId;
        console.log('👤 User authenticated:', userId);
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📄 File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type - expanded to support all common document formats
    const allowedTypes = [
      // Text files
      'text/plain', 'text/markdown', 'text/rtf',
      // Microsoft Office
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      // PDF
      'application/pdf',
      // HTML
      'text/html', 'application/xhtml+xml',
      // CSV
      'text/csv', 'application/csv',
      // JSON
      'application/json',
      // XML
      'application/xml', 'text/xml'
    ];
    
    // Also check file extension as fallback
    const fileExt = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['txt', 'md', 'rtf', 'docx', 'doc', 'pdf', 'html', 'htm', 'csv', 'xlsx', 'xls', 'json', 'xml'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt || '')) {
      console.log('❌ Invalid file type:', file.type, 'or extension:', fileExt);
      return NextResponse.json(
        { error: 'Invalid file type. Supported formats: TXT, MD, DOCX, PDF, HTML, CSV, XLSX, JSON, XML' },
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
    console.log('💾 File saved to:', filePath);

    // Process via Enhanced MCP Document Tools
    let processed = false;
    let processingError = null;
    
    try {
      console.log('🔄 Processing file with MCP Enhanced Document Tools...');
      
      const mcpResponse = await fetch(`${request.nextUrl.origin}/api/mcp/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'processDocument',
          serverType: 'enhanced',
          params: {
            file: {
              name: file.name,
              buffer: { data: Array.from(buffer) }
            },
            userId: userId || 'default'
          }
        }),
      });

      if (mcpResponse.ok) {
        const result = await mcpResponse.json();
        processed = result.success;
        console.log('✅ MCP processing result:', result);
        
        if (!processed) {
          processingError = result.error;
          console.error('❌ MCP processing failed:', result.error);
          }
        } else {
        const errorText = await mcpResponse.text();
        processingError = `MCP request failed: ${mcpResponse.status} - ${errorText}`;
        console.error('❌ MCP request failed:', mcpResponse.status, errorText);
      }
    } catch (e) {
      processingError = `MCP processing error: ${e}`;
      console.error('❌ MCP processing error:', e);
    }

    const response = {
      success: true,
      message: `File "${file.name}" uploaded${processed ? ' and processed' : ''} successfully`,
      fileName: file.name,
      processed,
      error: processingError
    };

    console.log('📤 Upload response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 