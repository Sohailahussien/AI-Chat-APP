import { NextRequest } from 'next/server';

// Try to import SimpleDocumentTools with error handling
let SimpleDocumentTools: any = null;
let simpleDocumentTools: any = null;

try {
  const module = require('@/mcp/tools/simpleDocumentTools');
  SimpleDocumentTools = module.SimpleDocumentTools || module.default;
  console.log('✅ SimpleDocumentTools imported successfully');
} catch (error) {
  console.error('❌ Failed to import SimpleDocumentTools:', error);
}

function getSimpleDocumentTools() {
  if (!SimpleDocumentTools) {
    throw new Error('SimpleDocumentTools not available');
  }
  
  if (!simpleDocumentTools) {
    try {
      simpleDocumentTools = new SimpleDocumentTools();
      console.log('✅ SimpleDocumentTools initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing SimpleDocumentTools:', error);
      throw error;
    }
  }
  return simpleDocumentTools;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('MCP TOOLS ROUTE HIT');
  try {
    const body = await req.json();
    const { tool, params, serverType = 'enhanced' } = body;
    
    console.log('Tool requested:', tool);
    console.log('Server type:', serverType);
    console.log('Params:', JSON.stringify(params, null, 2));
    
    let result;
    
    // Try to use real SimpleDocumentTools, fallback to mock responses
    try {
      if (SimpleDocumentTools) {
        console.log('Using real SimpleDocumentTools');
        const simpleTools = getSimpleDocumentTools();
        
        switch (tool) {
          case 'queryDocuments':
            console.log('Calling real queryDocuments with params:', params);
            result = await simpleTools.queryDocuments(params);
            break;
          case 'addDocument':
          case 'processDocument':
            console.log('Calling real processDocument with params:', params);
            result = await simpleTools.processDocument(params);
            break;
          case 'clearUserDocuments':
            console.log('Calling real clearUserDocuments with params:', params);
            result = await simpleTools.clearUserDocuments(params.userId);
            break;
          case 'getStats':
            console.log('Calling real getStats with params:', params);
            result = await simpleTools.getStats(params.userId);
            break;
          default:
            return new Response(JSON.stringify({ error: `Unknown tool: ${tool}` }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
        }
      } else {
        throw new Error('SimpleDocumentTools not available');
      }
    } catch (error) {
      console.log('⚠️ Falling back to mock responses due to error:', error);
      
      // Fallback to mock responses
      switch (tool) {
        case 'queryDocuments':
          console.log('Mock queryDocuments response');
          result = {
            success: true,
            documents: [],
            message: 'Mock response - SimpleDocumentTools not available'
          };
          break;
        case 'addDocument':
        case 'processDocument':
          console.log('Mock processDocument response');
          result = {
            success: true,
            message: 'Mock response - Document processing not available'
          };
          break;
        case 'clearUserDocuments':
          console.log('Mock clearUserDocuments response');
          result = {
            success: true,
            message: 'Mock response - Clear documents not available'
          };
          break;
        case 'getStats':
          console.log('Mock getStats response');
          result = {
            success: true,
            stats: {
              totalDocuments: 0,
              totalChunks: 0,
              userDocuments: 0
            },
            message: 'Mock response - Stats not available'
          };
          break;
        default:
          return new Response(JSON.stringify({ error: `Unknown tool: ${tool}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    console.log('Tool result:', JSON.stringify(result, null, 2));
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('MCP Tools API error:', error);
    return new Response(JSON.stringify({ 
      error: 'MCP tools request failed', 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 